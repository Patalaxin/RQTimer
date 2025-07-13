import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { isValidObjectId, Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CreateMobDtoRequest } from './dto/create-mob.dto';
import { Mob, MobDocument } from '../schemas/mob.schema';
import { MobsData, MobsDataDocument } from '../schemas/mobsData.schema';
import {
  GetFullMobDtoResponse,
  GetFullMobWithUnixDtoResponse,
  GetMobDtoRequest,
  GetMobDtoResponse,
  GetMobInGroupDtoRequest,
} from './dto/get-mob.dto';
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
import { RolesTypes, User } from '../schemas/user.schema';
import { GroupService } from '../group/group.service';
import { Group } from '../schemas/group.schema';
import { AddMobInGroupDtoRequest } from './dto/add-mob-in-group.dto';
import { plainToInstance } from 'class-transformer';
import { History, HistoryTypes } from '../history/history-types.interface';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import {
  UpdateMobCommentDtoBodyRequest,
  UpdateMobCommentDtoParamsRequest,
} from './dto/update-mob-comment.dto';
import { IMob } from './mob.interface';
import { translateMob } from '../utils/translate-mob';
import { IUnixtime } from '../unixtime/unixtime.interface';

export class MobService implements IMob {
  constructor(
    @InjectModel(Mob.name)
    private readonly mobModel: Model<MobDocument>,
    @InjectModel(MobsData.name)
    private readonly mobsDataModel: Model<MobsDataDocument>,
    private readonly usersService: UsersService,
    private readonly historyService: HistoryService,
    @Inject('IUnixtime') private readonly unixtimeService: IUnixtime,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: GroupService,
  ) {}

  async createMob(createMobDto: CreateMobDtoRequest): Promise<Mob> {
    try {
      const mob = await this.mobModel.create(createMobDto);
      await mob.save();
      return plainToInstance(Mob, mob.toObject());
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException(
          'A mob with the same name already exists in this location on this server.',
        );
      }
      throw new BadRequestException(err);
    }
  }

  async addMobInGroup(
    email: string,
    server: Servers,
    addMobInGroupDto: AddMobInGroupDtoRequest,
    groupName: string,
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    const group: Group = await this.groupService.getGroupByName(groupName);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const user: User = await this.usersService.findUser(email);
    if (!user.isGroupLeader && !group.canMembersAddMobs) {
      throw new NotFoundException(
        'In this group, default members cannot add mobs',
      );
    }

    const mobs = await this.mobModel
      .find({ _id: { $in: addMobInGroupDto.mobs } }, { __v: 0 })
      .lean()
      .exec();

    if (mobs.length !== addMobInGroupDto.mobs.length) {
      throw new BadRequestException('One or more mobs not found');
    }

    const mobDataArray = mobs.map((mob) => ({
      mobId: mob._id,
      server,
      groupName,
      mobTypeAdditionalTime: mob.mobType,
    }));

    try {
      await this.mobsDataModel.insertMany(mobDataArray, { ordered: false });
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
      // Если дубликаты — игнорируем ошибку, тк документы уже есть
    }

    // Загружаем все документы mobData для заданных mobs и группы
    const mobDataDocs = await this.mobsDataModel
      .find({
        mobId: { $in: addMobInGroupDto.mobs },
        groupName,
        server,
      })
      .exec();

    const unixtimeResponse = this.unixtimeService.getCurrentUnixtime();

    return mobs.map((mob) => {
      const translatedMob = translateMob(mob);
      const mobInstance = plainToInstance(Mob, translatedMob, {
        excludeExtraneousValues: true,
      });

      // Ищем соответствующий mobData документ
      const mobData = mobDataDocs.find(
        (md) => md.mobId.toString() === mob._id.toString(),
      );

      const mobDataInstance = mobData
        ? plainToInstance(MobsData, mobData.toObject(), {
            excludeExtraneousValues: true,
          })
        : null;

      return {
        mob: mobInstance,
        mobData: mobDataInstance,
        unixtime: unixtimeResponse.unixtime,
      };
    });
  }

  async getMob(
    getMobDto: GetMobDtoRequest,
    lang: string = 'ru',
  ): Promise<GetMobDtoResponse> {
    try {
      const mob = await this.mobModel
        .findById(getMobDto.mobId, { __v: 0 })
        .lean();

      if (!mob) {
        throw new Error();
      }

      const translatedMob = translateMob(mob, lang);
      const mobInstance = plainToInstance(Mob, translatedMob, {
        excludeExtraneousValues: true,
      });

      return {
        mob: mobInstance,
      };
    } catch {
      if (!isValidObjectId(getMobDto.mobId)) {
        throw new BadRequestException(`Invalid ObjectId: ${getMobDto.mobId}`);
      } else {
        throw new BadRequestException(
          'Mob or Mob data not found for this group',
        );
      }
    }
  }

  async getMobFromGroup(
    getMobDto: GetMobInGroupDtoRequest,
    groupName: string,
    lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse> {
    try {
      const [mob, mobData, unixtimeResponse] = await Promise.all([
        this.mobModel.findById(getMobDto.mobId, { __v: 0 }).lean().exec(),

        this.mobsDataModel
          .findOne(
            {
              mobId: getMobDto.mobId,
              server: getMobDto.server,
              groupName: groupName,
            },
            { __v: 0, _id: 0 },
          )
          .lean()
          .exec(),

        this.unixtimeService.getCurrentUnixtime(),
      ]);

      if (!mob || !mobData) {
        throw new Error();
      }

      const translatedMob = translateMob(mob, lang);
      const mobInstance = plainToInstance(Mob, translatedMob, {
        excludeExtraneousValues: true,
      });
      const mobDataInstance = plainToInstance(MobsData, mobData, {
        excludeExtraneousValues: true,
      });

      return {
        mob: mobInstance,
        mobData: mobDataInstance,
        unixtime: unixtimeResponse.unixtime,
      };
    } catch {
      if (!isValidObjectId(getMobDto.mobId)) {
        throw new BadRequestException(`Invalid ObjectId: ${getMobDto.mobId}`);
      } else {
        throw new BadRequestException(
          'Mob or Mob data not found for this group',
        );
      }
    }
  }

  async findAllMobsByUser(
    email: string,
    getMobsDto: GetMobsDtoRequest,
    lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    const [userData, unixtimeResponse] = await Promise.all([
      this.usersService.findUser(email),
      this.unixtimeService.getCurrentUnixtime(),
    ]);

    const { excludedMobs = [], unavailableMobs = [], groupName } = userData;

    const undisplayedMobIds = Array.from(
      new Set([...excludedMobs, ...unavailableMobs]),
    );

    const allMobsData = await this.mobsDataModel
      .find(
        { groupName: groupName, server: getMobsDto.server },
        { __v: 0, _id: 0 },
      )
      .lean()
      .exec();

    const mobIds = allMobsData
      .map((data) => data.mobId.toString())
      .filter((id) => !undisplayedMobIds.includes(id));

    if (mobIds.length === 0) return [];

    const allMobs = await this.mobModel
      .find(
        { _id: { $in: mobIds.map((id) => new mongoose.Types.ObjectId(id)) } },
        { __v: 0 },
      )
      .lean()
      .exec();

    const allMobsDataMap = new Map<string, MobsData>();
    allMobsData.forEach((data) => {
      allMobsDataMap.set(data.mobId.toString(), data);
    });

    return allMobs.map((mob) => {
      const translatedMob = translateMob(mob, lang);
      const mobInstance = plainToInstance(Mob, translatedMob, {
        excludeExtraneousValues: true,
      });

      const mobDataRaw = allMobsDataMap.get(mob._id.toString());
      const mobDataInstance = mobDataRaw
        ? plainToInstance(MobsData, mobDataRaw, {
            excludeExtraneousValues: true,
          })
        : null;

      return {
        mob: mobInstance,
        mobData: mobDataInstance,
        unixtime: unixtimeResponse.unixtime,
      };
    });
  }

  async findAllMobsByGroup(
    groupName: string,
    getMobsDto: GetMobsDtoRequest,
    lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    const unixtimeResponse = this.unixtimeService.getCurrentUnixtime();

    const allMobsData = await this.mobsDataModel
      .find({ groupName: groupName, server: getMobsDto.server }, { __v: 0 })
      .lean()
      .exec();

    const mobIds = allMobsData.map(
      (data) => new mongoose.Types.ObjectId(data.mobId),
    );

    const allMobs = await this.mobModel
      .find(
        {
          _id: { $in: mobIds },
        },
        { __v: 0 },
      )
      .lean()
      .exec();

    const allMobsDataMap = new Map<string, MobsData>();
    allMobsData.forEach((data) => {
      allMobsDataMap.set(data.mobId.toString(), data);
    });

    return allMobs.map((mob) => {
      const mobData = allMobsDataMap.get(mob._id.toString()) || null;

      return {
        mob: translateMob(mob, lang),
        mobData,
        unixtime: unixtimeResponse.unixtime,
      };
    });
  }

  async findAllAvailableMobs(lang: string = 'ru'): Promise<Mob[]> {
    const mobs = await this.mobModel.find().select('-__v').lean();

    const translated = mobs.map((mob) => translateMob(mob, lang));

    return plainToInstance(Mob, translated, { excludeExtraneousValues: true });
  }

  async updateMob(
    updateMobDtoBody: UpdateMobDtoBodyRequest,
    updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<Mob> {
    const mob: Mob = await this.mobModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(updateMobDtoParams.mobId),
        },
        { $set: updateMobDtoBody },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();

    return plainToInstance(Mob, mob, { excludeExtraneousValues: true });
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
    let { comment } = updateMobByCooldownDto;

    if (!comment) {
      comment = '';
    }

    const getMobDto = { mobId, server };

    const mob: GetFullMobDtoResponse = await this.getMobFromGroup(
      getMobDto,
      groupName,
    );

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

    const updatedMobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        { mobId: mobId, groupName: groupName, server: server },
        {
          $inc: { cooldown },
          respawnTime: nextResurrectTime,
          comment: comment,
          respawnLost: false,
        },
        { new: true },
      )
      .select('-__v -_id')
      .lean()
      .exec();

    if (!updatedMobData) {
      throw new Error('Failed to update mob data.');
    }

    await this.historyService.createHistory(history);

    return { mob: mob.mob, mobData: updatedMobData };
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
    let { comment } = updateMobDateOfDeathDto;

    if (!comment) {
      comment = '';
    }

    const getMobDto = { mobId, server };

    const mob: GetFullMobDtoResponse = await this.getMobFromGroup(
      getMobDto,
      groupName,
    );

    const nextResurrectTime: number = dateOfDeath + mob.mob.cooldownTime;

    const history: History = {
      mobId: mobId,
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

    const updatedMobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        { mobId: mobId, groupName: groupName, server: server },
        {
          respawnTime: nextResurrectTime,
          cooldown: 0,
          deathTime: dateOfDeath,
          comment: comment,
          respawnLost: false,
        },
        { new: true },
      )
      .select('-_id -__v')
      .lean()
      .exec();

    if (!updatedMobData) {
      throw new Error('Failed to update mob data.');
    }

    await this.historyService.createHistory(history);

    return { mob: mob.mob, mobData: updatedMobData };
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
    let { comment } = updateMobDateOfRespawnDto;

    if (!comment) {
      comment = '';
    }

    const getMobDto = { mobId, server };

    const mob: GetFullMobDtoResponse = await this.getMobFromGroup(
      getMobDto,
      groupName,
    );

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

    const updatedMobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        { mobId: mobId, groupName: groupName, server: server },
        {
          respawnTime: nextResurrectTime,
          cooldown: 0,
          deathTime: adjustedDeathTime,
          comment: comment,
          respawnLost: false,
        },
        { new: true },
      )
      .select('-_id -__v')
      .lean()
      .exec();

    if (!updatedMobData) {
      throw new BadRequestException('Failed to update mob data.');
    }

    await this.historyService.createHistory(history);

    return { mob: mob.mob, mobData: updatedMobData };
  }

  async deleteMob(mobId: string): Promise<DeleteMobDtoResponse> {
    const mob: Mob = await this.mobModel
      .findOneAndDelete(
        {
          _id: mobId,
        },
        { __v: 0 },
      )
      .exec();

    if (!mob) {
      throw new NotFoundException('Mob not found');
    }

    await this.mobsDataModel.deleteMany({
      mobId: mobId,
    });

    return { message: 'Mob deleted' };
  }

  async removeMobFromGroup(
    removeMobDtoParams: RemoveMobFromGroupDtoParamsRequest,
    groupName: string,
  ): Promise<RemoveMobFromGroupDtoResponse> {
    const { mobId, server } = removeMobDtoParams;

    const getMobDto: GetMobInGroupDtoRequest = { mobId, server };

    const mob: GetFullMobDtoResponse = await this.getMobFromGroup(
      getMobDto,
      groupName,
    );

    if (!mob) {
      throw new NotFoundException('Mob not found');
    }

    await this.mobsDataModel.deleteOne({
      mobId: mobId,
      groupName: groupName,
      server: server,
    });

    return { message: 'Mob deleted from group' };
  }

  async crashMobServer(
    groupName: string,
    email: string,
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
      groupName: groupName,
    };

    try {
      await Promise.all([
        this.mobsDataModel.updateMany(
          {
            respawnTime: { $gte: Date.now() },
            mobTypeAdditionalTime: MobsTypes.Босс,
            server: server,
            groupName: groupName,
          },
          { $inc: { respawnTime: -300000 } },
        ),
        this.mobsDataModel.updateMany(
          {
            respawnTime: { $gte: Date.now() },
            mobTypeAdditionalTime: MobsTypes.Элитка,
            server: server,
            groupName: groupName,
          },
          { $inc: { respawnTime: -18000 } },
        ),
      ]);

      await this.historyService.createHistory(history);

      return this.findAllMobsByUser(email, { server });
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
      const mob: GetFullMobDtoResponse = await this.getMobFromGroup(
        respawnLostDtoParams,
        groupName,
      );

      const mobData: MobsData = await this.mobsDataModel
        .findOneAndUpdate(
          {
            mobId: mobId,
            groupName: groupName,
            server: server,
          },
          {
            cooldown: 0,
            respawnTime: null,
            deathTime: null,
            respawnLost: true,
          },
          { new: true },
        )
        .select('-_id -__v')
        .lean()
        .exec();

      const history: History = {
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

      return { mob: mob.mob, mobData };
    } catch {
      throw new BadRequestException('Failed to process respawn lost.');
    }
  }

  async deleteAllMobData(
    groupName: string,
  ): Promise<DeleteAllMobsDataDtoResponse> {
    await this.mobsDataModel.deleteMany({
      groupName: groupName,
    });

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

    const mobData = await this.mobsDataModel
      .findOneAndUpdate(
        {
          mobId: mobId,
          server: server,
          groupName: groupName,
        },
        { $set: updateMobCommentBody },
        { new: true },
      )
      .select('-_id -__v')
      .lean()
      .exec();

    if (!mobData) {
      throw new NotFoundException('Mob data not found');
    }

    return {
      mob: mobFromGroup.mob,
      mobData: plainToInstance(MobsData, mobData, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
