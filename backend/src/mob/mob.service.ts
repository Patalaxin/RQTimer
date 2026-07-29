import { forwardRef, Inject } from '@nestjs/common';
import {
  Mob as PrismaMob,
  MobsData as PrismaMobsData,
  Server,
} from '@prisma/client';
import { ConflictError } from '../errors/app.error';
import { mapPrismaError } from '../errors/map-prisma-error';
import { GroupNotFound } from '../group/group.errors';
import {
  MobDataNotFound,
  MobNotFound,
  MobNotFoundInGroup,
  MobsAddForbidden,
  RespawnTimeMissing,
  UnknownMobsRequested,
} from './mob.errors';
import { UsersService } from '../users/users.service';
import { CreateMobDtoRequest } from './dto/create-mob.dto';
import {
  GetFullMobDtoResponse,
  GetFullMobWithUnixDtoResponse,
  GetMobDtoRequest,
  GetMobDtoResponse,
  GetMobInGroupDtoRequest,
} from './dto/get-mob.dto';
import { MobDto, MobsDataDto } from './dto/mob.dto';
import { GetMobsDtoRequest } from './dto/get-all-mobs.dto';
import {
  UpdateMobDtoBodyRequest,
  UpdateMobDtoParamsRequest,
} from './dto/update-mob.dto';
import {
  RespawnInput,
  UpdateMobRespawnDtoRequest,
} from './dto/update-mob-respawn.dto';
import { HistoryService } from '../history/history.service';
import { MobName, MobsTypes, Servers } from '../schemas/mobs.enum';
import {
  DeleteAllMobsDataDtoResponse,
  DeleteMobDtoResponse,
  RemoveMobFromGroupDtoParamsRequest,
  RemoveMobFromGroupDtoResponse,
} from './dto/delete-mob.dto';
import { RolesTypes } from '../schemas/roles.enum';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { GroupService } from '../group/group.service';
import { GroupResponseDto } from '../group/dto/group-response.dto';
import { AddMobInGroupDtoRequest } from './dto/add-mob-in-group.dto';
import { History, HistoryTypes } from '../history/history-types.interface';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import {
  UpdateMobCommentDtoBodyRequest,
  UpdateMobCommentDtoParamsRequest,
} from './dto/update-mob-comment.dto';
import { IMob } from './mob.interface';
import { translateMob } from '../utils/translate-mob';
import { IUnixtime } from '../unixtime/unixtime.interface';
import { PrismaService } from '../prisma/prisma.service';

/** Чем выбранное представление времени оборачивается для строки mobs_data. */
interface RespawnChange {
  historyTypes: HistoryTypes;
  respawnTime: number;
  data: { cooldown: number | { increment: number }; deathTime?: number };
  historyExtras?: Pick<History, 'fromCooldown' | 'toCooldown'>;
}

/** На сколько сдвигается респаун при краше сервера. */
const CRASH_SHIFT_MS: Record<string, number> = {
  [MobsTypes.Босс]: 300_000,
  [MobsTypes.Элитка]: 18_000,
};

export class MobService implements IMob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly historyService: HistoryService,
    @Inject('IUnixtime') private readonly unixtimeService: IUnixtime,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: GroupService,
  ) {}

  /**
   * В БД mobName/location/mobType — обычные строки (см. комментарий в
   * schema.prisma), наружу же они уходят как значения соответствующих enum'ов.
   * Каст живёт здесь, чтобы не расползаться по вызовам.
   */
  private toMobDto(mob: PrismaMob): MobDto {
    const { id, ...rest } = mob;
    return { _id: id, ...rest } as MobDto;
  }

  private toMobsDataDto(mobsData: PrismaMobsData | null): MobsDataDto | null {
    if (!mobsData) {
      return null;
    }
    return { ...mobsData } as unknown as MobsDataDto;
  }

  private mobDataKey(mobId: string, groupName: string, server: Servers) {
    return {
      mobId_groupName_server: {
        mobId,
        groupName,
        server: server as unknown as Server,
      },
    };
  }

  async createMob(createMobDto: CreateMobDtoRequest): Promise<MobDto> {
    try {
      const mob = await this.prisma.mob.create({ data: createMobDto });
      return this.toMobDto(mob);
    } catch (error) {
      // Всё, кроме занятого имени, уходит наверх как есть: раньше здесь любая
      // ошибка становилась 400 с сырым объектом Prisma в теле ответа, который
      // фронт показывал пользователю тостом.
      throw mapPrismaError(error, {
        P2002: () =>
          new ConflictError(
            'MOB_ALREADY_EXISTS',
            'A mob with the same name already exists in this location on this server.',
          ),
      });
    }
  }

  async addMobInGroup(
    email: string,
    server: Servers,
    addMobInGroupDto: AddMobInGroupDtoRequest,
    groupName: string,
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    const group: GroupResponseDto =
      await this.groupService.getGroupByName(groupName);
    if (!group) {
      throw new GroupNotFound();
    }

    const user: UserResponseDto = await this.usersService.findUser(email);
    if (!user.isGroupLeader && !group.canMembersAddMobs) {
      throw new MobsAddForbidden();
    }

    const mobs = await this.prisma.mob.findMany({
      where: { id: { in: addMobInGroupDto.mobs } },
    });

    if (mobs.length !== addMobInGroupDto.mobs.length) {
      throw new UnknownMobsRequested();
    }

    // Уже добавленные мобы пропускаем — повторный вызов не должен падать.
    await this.prisma.mobsData.createMany({
      data: mobs.map((mob) => ({
        mobId: mob.id,
        server: server as unknown as Server,
        groupName,
        mobTypeAdditionalTime: mob.mobType,
      })),
      skipDuplicates: true,
    });

    const mobDataRows = await this.prisma.mobsData.findMany({
      where: {
        mobId: { in: addMobInGroupDto.mobs },
        groupName,
        server: server as unknown as Server,
      },
    });
    const mobDataByMobId = new Map(mobDataRows.map((row) => [row.mobId, row]));

    const unixtimeResponse = this.unixtimeService.getCurrentUnixtime();

    return mobs.map((mob) => ({
      mob: translateMob(this.toMobDto(mob)),
      mobData: this.toMobsDataDto(mobDataByMobId.get(mob.id) ?? null),
      unixtime: unixtimeResponse.unixtime,
    }));
  }

  async getMob(
    getMobDto: GetMobDtoRequest,
    lang: string = 'ru',
  ): Promise<GetMobDtoResponse> {
    const mob = await this.prisma.mob.findUnique({
      where: { id: getMobDto.mobId },
    });

    if (!mob) {
      // Ручка смотрит в справочник и про группы ничего не знает — прежний текст
      // «not found for this group» был копипастой из getMobFromGroup.
      throw new MobNotFound();
    }

    return { mob: translateMob(this.toMobDto(mob), lang) };
  }

  async getMobFromGroup(
    getMobDto: GetMobInGroupDtoRequest,
    groupName: string,
    lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse> {
    const [mob, mobData] = await Promise.all([
      this.prisma.mob.findUnique({ where: { id: getMobDto.mobId } }),
      this.prisma.mobsData.findUnique({
        where: this.mobDataKey(getMobDto.mobId, groupName, getMobDto.server),
      }),
    ]);
    const unixtimeResponse = this.unixtimeService.getCurrentUnixtime();

    if (!mob || !mobData) {
      throw new MobNotFoundInGroup();
    }

    return {
      mob: translateMob(this.toMobDto(mob), lang),
      mobData: this.toMobsDataDto(mobData),
      unixtime: unixtimeResponse.unixtime,
    };
  }

  async findAllGroupMobs(
    getMobsDto: GetMobsDtoRequest,
    groupName: string,
    lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    const unixtimeResponse = this.unixtimeService.getCurrentUnixtime();

    const allMobsData = await this.prisma.mobsData.findMany({
      where: { groupName, server: getMobsDto.server as unknown as Server },
      include: { mob: true },
    });

    return allMobsData.map((mobData) => {
      const { mob, ...rest } = mobData;
      return {
        mob: translateMob(this.toMobDto(mob), lang),
        mobData: this.toMobsDataDto(rest as PrismaMobsData),
        unixtime: unixtimeResponse.unixtime,
      };
    });
  }

  async findAllMobsByGroup(
    groupName: string,
    getMobsDto: GetMobsDtoRequest,
    lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    return this.findAllGroupMobs(getMobsDto, groupName, lang);
  }

  async findAllAvailableMobs(lang: string = 'ru'): Promise<MobDto[]> {
    const mobs = await this.prisma.mob.findMany();

    return mobs.map((mob) => translateMob(this.toMobDto(mob), lang));
  }

  async updateMob(
    updateMobDtoBody: UpdateMobDtoBodyRequest,
    updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<MobDto> {
    try {
      const mob = await this.prisma.mob.update({
        where: { id: updateMobDtoParams.mobId },
        data: updateMobDtoBody,
      });

      return this.toMobDto(mob);
    } catch (error) {
      throw mapPrismaError(error, {
        P2025: () => new MobNotFound(),
      });
    }
  }

  /**
   * Единственная запись времени респауна. Все три представления (сдвиг на
   * кулдауны, момент смерти, момент респауна) отличаются только тем, как из
   * запроса получается новое время и что попадает в историю; чтение моба,
   * запись строки и создание записи истории у них общие.
   */
  async updateMobRespawn(
    nickname: string,
    role: RolesTypes,
    mobId: string,
    server: Servers,
    updateMobRespawnDto: UpdateMobRespawnDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse> {
    const comment = updateMobRespawnDto.comment ?? '';

    const mob = await this.getMobFromGroup({ mobId, server }, groupName);
    const change = this.resolveRespawnChange(updateMobRespawnDto, mob);

    const history: History = {
      mobId,
      location: mob.mob.location,
      mobName: mob.mob.mobName,
      nickname,
      server,
      groupName,
      date: Date.now(),
      role,
      historyTypes: change.historyTypes,
      toWillResurrect: change.respawnTime,
      ...change.historyExtras,
    };

    const updatedMobData = await this.prisma.mobsData.update({
      where: this.mobDataKey(mobId, groupName, server),
      data: {
        ...change.data,
        respawnTime: change.respawnTime,
        comment,
        respawnLost: false,
      },
    });

    await this.historyService.createHistory(history);

    return { mob: mob.mob, mobData: this.toMobsDataDto(updatedMobData) };
  }

  /** Переводит выбранное представление в изменение строки mobs_data. */
  private resolveRespawnChange(
    { by, value }: UpdateMobRespawnDtoRequest,
    mob: GetFullMobWithUnixDtoResponse,
  ): RespawnChange {
    const { cooldownTime } = mob.mob;

    switch (by) {
      case RespawnInput.cooldown: {
        // Сдвиг считается от текущего респауна, поэтому без него не обойтись.
        if (mob.mobData.respawnTime === null) {
          throw new RespawnTimeMissing();
        }

        return {
          historyTypes: HistoryTypes.updateMobByCooldown,
          respawnTime: cooldownTime * value + mob.mobData.respawnTime,
          data: { cooldown: { increment: value } },
          historyExtras: {
            fromCooldown: mob.mobData.cooldown,
            toCooldown: mob.mobData.cooldown + value,
          },
        };
      }

      case RespawnInput.dateOfDeath:
        return {
          historyTypes: HistoryTypes.updateMobDateOfDeath,
          respawnTime: value + cooldownTime,
          data: { cooldown: 0, deathTime: value },
        };

      case RespawnInput.dateOfRespawn: {
        // Момент смерти считается назад от респауна и не может уйти за эпоху.
        const deathTime = value - cooldownTime;

        return {
          historyTypes: HistoryTypes.updateMobDateOfRespawn,
          respawnTime: value,
          data: { cooldown: 0, deathTime: deathTime < 0 ? 0 : deathTime },
        };
      }
    }
  }

  async deleteMob(mobId: string): Promise<DeleteMobDtoResponse> {
    try {
      // Строки mobs_data уезжают следом по ON DELETE CASCADE.
      await this.prisma.mob.delete({ where: { id: mobId } });
    } catch (error) {
      throw mapPrismaError(error, {
        P2025: () => new MobNotFound(),
      });
    }

    return { message: 'Mob deleted' };
  }

  async removeMobFromGroup(
    removeMobDtoParams: RemoveMobFromGroupDtoParamsRequest,
    groupName: string,
  ): Promise<RemoveMobFromGroupDtoResponse> {
    const { mobId, server } = removeMobDtoParams;

    // Бросит 404, если моба нет в группе.
    await this.getMobFromGroup({ mobId, server }, groupName);

    await this.prisma.mobsData.delete({
      where: this.mobDataKey(mobId, groupName, server),
    });

    return { message: 'Mob deleted from group' };
  }

  async crashMobServer(
    groupName: string,
    nickname: string,
    role: RolesTypes,
    server: Servers,
  ): Promise<GetFullMobDtoResponse[]> {
    const history: History = {
      mobName: MobName.Все,
      nickname,
      server,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.crashMobServer,
      crashServer: true,
      groupName,
    };

    const now = Date.now();
    // Боссам и элиткам краш сдвигает респаун на разное время.
    await this.prisma.$transaction(
      Object.entries(CRASH_SHIFT_MS).map(([mobType, shiftMs]) =>
        this.prisma.mobsData.updateMany({
          where: {
            respawnTime: { gte: now },
            mobTypeAdditionalTime: mobType,
            server: server as unknown as Server,
            groupName,
          },
          data: { respawnTime: { decrement: shiftMs } },
        }),
      ),
    );

    await this.historyService.createHistory(history);

    return this.findAllGroupMobs({ server }, groupName);
  }

  async respawnLost(
    respawnLostDtoParams: RespawnLostDtoParamsRequest,
    nickname: string,
    role: RolesTypes,
    groupName: string,
  ): Promise<GetFullMobDtoResponse> {
    const { server, mobId } = respawnLostDtoParams;

    const mob = await this.getMobFromGroup(respawnLostDtoParams, groupName);

    const mobData = await this.prisma.mobsData.update({
      where: this.mobDataKey(mobId, groupName, server),
      data: {
        cooldown: 0,
        respawnTime: null,
        deathTime: null,
        respawnLost: true,
      },
    });

    const history: History = {
      mobId,
      location: mob.mob.location,
      mobName: mob.mob.mobName,
      nickname,
      server,
      groupName,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.respawnLost,
    };

    await this.historyService.createHistory(history);

    return { mob: mob.mob, mobData: this.toMobsDataDto(mobData) };
  }

  async deleteAllMobData(
    groupName: string,
  ): Promise<DeleteAllMobsDataDtoResponse> {
    await this.prisma.mobsData.deleteMany({ where: { groupName } });

    return { message: 'All Mobs Data deleted' };
  }

  async updateMobComment(
    groupName: string,
    updateMobCommentBody: UpdateMobCommentDtoBodyRequest,
    updateMobCommentParams: UpdateMobCommentDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse> {
    const { mobId, server } = updateMobCommentParams;

    const mobFromGroup = await this.getMobFromGroup(
      { mobId, server },
      groupName,
    );

    try {
      const mobData = await this.prisma.mobsData.update({
        where: this.mobDataKey(mobId, groupName, server),
        data: updateMobCommentBody,
      });

      return {
        mob: mobFromGroup.mob,
        mobData: this.toMobsDataDto(mobData),
      };
    } catch (error) {
      throw mapPrismaError(error, {
        P2025: () => new MobDataNotFound(),
      });
    }
  }
}
