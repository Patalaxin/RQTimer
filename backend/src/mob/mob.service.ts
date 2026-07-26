import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  Mob as PrismaMob,
  MobsData as PrismaMobsData,
  Prisma,
  Server,
} from '@prisma/client';
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
import { UpdateMobByCooldownDtoRequest } from './dto/update-mob-by-cooldown.dto';
import { HistoryService } from '../history/history.service';
import { UpdateMobDateOfDeathDtoRequest } from './dto/update-mob-date-of-death.dto';
import { UpdateMobDateOfRespawnDtoRequest } from './dto/update-mob-date-of-respawn.dto';
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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A mob with the same name already exists in this location on this server.',
        );
      }
      throw new BadRequestException(error);
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
      throw new NotFoundException('Group not found');
    }

    const user: UserResponseDto = await this.usersService.findUser(email);
    if (!user.isGroupLeader && !group.canMembersAddMobs) {
      throw new NotFoundException(
        'In this group, default members cannot add mobs',
      );
    }

    const mobs = await this.prisma.mob.findMany({
      where: { id: { in: addMobInGroupDto.mobs } },
    });

    if (mobs.length !== addMobInGroupDto.mobs.length) {
      throw new BadRequestException('One or more mobs not found');
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
      throw new BadRequestException('Mob or Mob data not found for this group');
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
      throw new BadRequestException('Mob or Mob data not found for this group');
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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Mob not found');
      }
      throw error;
    }
  }

  async updateMobByCooldown(
    nickname: string,
    role: RolesTypes,
    mobId: string,
    server: Servers,
    updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse> {
    const { cooldown } = updateMobByCooldownDto;
    const comment = updateMobByCooldownDto.comment ?? '';

    const mob = await this.getMobFromGroup({ mobId, server }, groupName);

    if (mob.mobData.respawnTime === null) {
      throw new BadRequestException(
        'Respawn time is missing. Specify either date of death or date of respawn.',
      );
    }

    const nextResurrectTime: number =
      mob.mob.cooldownTime * cooldown + mob.mobData.respawnTime;

    const history: History = {
      mobId,
      location: mob.mob.location,
      mobName: mob.mob.mobName,
      nickname,
      server,
      groupName,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.updateMobByCooldown,
      toWillResurrect: nextResurrectTime,
      fromCooldown: mob.mobData.cooldown,
      toCooldown: mob.mobData.cooldown + cooldown,
    };

    const updatedMobData = await this.prisma.mobsData.update({
      where: this.mobDataKey(mobId, groupName, server),
      data: {
        cooldown: { increment: cooldown },
        respawnTime: nextResurrectTime,
        comment,
        respawnLost: false,
      },
    });

    await this.historyService.createHistory(history);

    return { mob: mob.mob, mobData: this.toMobsDataDto(updatedMobData) };
  }

  async updateMobDateOfDeath(
    nickname: string,
    role: RolesTypes,
    mobId: string,
    server: Servers,
    updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse> {
    const { dateOfDeath } = updateMobDateOfDeathDto;
    const comment = updateMobDateOfDeathDto.comment ?? '';

    const mob = await this.getMobFromGroup({ mobId, server }, groupName);

    const nextResurrectTime: number = dateOfDeath + mob.mob.cooldownTime;

    const history: History = {
      mobId,
      location: mob.mob.location,
      mobName: mob.mob.mobName,
      nickname,
      server,
      groupName,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.updateMobDateOfDeath,
      toWillResurrect: nextResurrectTime,
    };

    const updatedMobData = await this.prisma.mobsData.update({
      where: this.mobDataKey(mobId, groupName, server),
      data: {
        respawnTime: nextResurrectTime,
        cooldown: 0,
        deathTime: dateOfDeath,
        comment,
        respawnLost: false,
      },
    });

    await this.historyService.createHistory(history);

    return { mob: mob.mob, mobData: this.toMobsDataDto(updatedMobData) };
  }

  async updateMobDateOfRespawn(
    nickname: string,
    role: RolesTypes,
    mobId: string,
    server: Servers,
    updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse> {
    const { dateOfRespawn } = updateMobDateOfRespawnDto;
    const comment = updateMobDateOfRespawnDto.comment ?? '';

    const mob = await this.getMobFromGroup({ mobId, server }, groupName);

    const nextResurrectTime: number = dateOfRespawn;
    const deathTime: number = nextResurrectTime - mob.mob.cooldownTime;
    const adjustedDeathTime: number = deathTime < 0 ? 0 : deathTime;

    const history: History = {
      mobId,
      location: mob.mob.location,
      mobName: mob.mob.mobName,
      nickname,
      server,
      groupName,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.updateMobDateOfRespawn,
      toWillResurrect: nextResurrectTime,
    };

    const updatedMobData = await this.prisma.mobsData.update({
      where: this.mobDataKey(mobId, groupName, server),
      data: {
        respawnTime: nextResurrectTime,
        cooldown: 0,
        deathTime: adjustedDeathTime,
        comment,
        respawnLost: false,
      },
    });

    await this.historyService.createHistory(history);

    return { mob: mob.mob, mobData: this.toMobsDataDto(updatedMobData) };
  }

  async deleteMob(mobId: string): Promise<DeleteMobDtoResponse> {
    try {
      // Строки mobs_data уезжают следом по ON DELETE CASCADE.
      await this.prisma.mob.delete({ where: { id: mobId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Mob not found');
      }
      throw error;
    }

    return { message: 'Mob deleted' };
  }

  async removeMobFromGroup(
    removeMobDtoParams: RemoveMobFromGroupDtoParamsRequest,
    groupName: string,
  ): Promise<RemoveMobFromGroupDtoResponse> {
    const { mobId, server } = removeMobDtoParams;

    // Бросит 400, если моба нет в группе.
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

    try {
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
    } catch {
      throw new BadRequestException(
        'Something went wrong while crashing the server.',
      );
    }
  }

  async respawnLost(
    respawnLostDtoParams: RespawnLostDtoParamsRequest,
    nickname: string,
    role: RolesTypes,
    groupName: string,
  ): Promise<GetFullMobDtoResponse> {
    const { server, mobId } = respawnLostDtoParams;

    try {
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
    } catch {
      throw new BadRequestException('Failed to process respawn lost.');
    }
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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Mob data not found');
      }
      throw error;
    }
  }
}
