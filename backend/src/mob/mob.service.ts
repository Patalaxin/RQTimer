import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { IMob } from './mob.interface';
import { CreateMobDtoRequest } from './dto/create-mob.dto';
import { Mob, MobDocument } from '../schemas/mob.schema';
import { MobsData, MobsDataDocument } from '../schemas/mobsData.schema';
import {
  GetFullMobDtoResponse,
  GetFullMobWithUnixDtoResponse,
  GetMobDtoRequest,
  GetMobDtoResponse,
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
  DeleteMobDtoParamsRequest,
  DeleteMobDtoResponse,
  DeleteMobFromGroupDtoParamsRequest,
  DeleteMobFromGroupDtoResponse,
} from './dto/delete-mob.dto';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import { RolesTypes } from '../schemas/user.schema';
import { UnixtimeService } from '../unixtime/unixtime.service';
import { GroupService } from '../group/group.service';
import { Group } from '../schemas/group.shema';
import { AddMobInGroupDtoRequest } from './dto/add-mob-in-group.dto';
import { plainToInstance } from 'class-transformer';
import { History, HistoryTypes } from '../history/history-types.interface';

export class MobService implements IMob {
  constructor(
    @InjectModel(Mob.name)
    private mobModel: Model<MobDocument>,
    @InjectModel(MobsData.name)
    private mobsDataModel: Model<MobsDataDocument>,
    private usersService: UsersService,
    private historyService: HistoryService,
    private readonly unixtimeService: UnixtimeService,
    @Inject(forwardRef(() => GroupService)) private groupService: GroupService,
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
    addMobInGroupDto: AddMobInGroupDtoRequest,
    groupName: string,
  ): Promise<MobsData> {
    const group: Group = await this.groupService.getGroupByName(groupName);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const mob = await this.mobModel
      .findOne(
        {
          location: addMobInGroupDto.location,
          mobName: addMobInGroupDto.mobName,
        },
        { __v: 0 },
      )
      .exec();

    if (!mob) {
      throw new BadRequestException('Mob not found');
    }

    const mobData = new this.mobsDataModel({
      mobId: mob._id,
      server: addMobInGroupDto.server,
      groupName: groupName,
      mobTypeAdditionalTime: mob.mobType,
    });

    try {
      await mobData.save();
      return plainToInstance(MobsData, mobData.toObject());
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Mob data already exists');
      }
      throw error;
    }
  }

  async findMob(
    getMobDto: GetMobDtoRequest,
    groupName: string,
  ): Promise<GetFullMobWithUnixDtoResponse> {
    const [mob, unixtimeResponse] = await Promise.all([
      this.mobModel
        .findOne(
          {
            location: getMobDto.location,
            mobName: getMobDto.mobName,
          },
          { __v: 0 },
        )
        .lean()
        .exec(),

      this.unixtimeService.getUnixtime(),
    ]);

    if (!mob) {
      throw new BadRequestException('Mob not found');
    }

    const mobData = await this.mobsDataModel
      .findOne(
        {
          mobId: mob._id,
          server: getMobDto.server,
          groupName: groupName,
        },
        { __v: 0, _id: 0 },
      )
      .lean()
      .exec();

    if (!mobData) {
      throw new BadRequestException('Mob data not found for this group');
    }

    return {
      mob,
      mobData,
      unixtime: unixtimeResponse.unixtime,
    };
  }

  async findAllMobsByUser(
    email: string,
    getMobsDto: GetMobsDtoRequest,
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    const [userData, unixtimeResponse] = await Promise.all([
      this.usersService.findUser(email),
      this.unixtimeService.getUnixtime(),
    ]);

    const { excludedMobs, unavailableMobs, groupName } = userData;

    const undisplayedMobs: string[] = excludedMobs.concat(
      unavailableMobs.filter((item) => excludedMobs.indexOf(item) === -1),
    );

    const arrayOfObjectsUndisplayedMob = undisplayedMobs.map((item) => ({
      mobName: item,
    }));
    arrayOfObjectsUndisplayedMob.push({ mobName: 'Mocked Name of Mob' });

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
          $nor: arrayOfObjectsUndisplayedMob,
        },
        { __v: 0 },
      )
      .lean()
      .exec();

    const allMobsDataMap = new Map<string, MobsData>();
    allMobsData.forEach((data) => {
      allMobsDataMap.set(data.mobId.toString(), data);
    });

    const allMobsMap = new Map<string, any>();
    allMobs.forEach((mob) => {
      allMobsMap.set(mob._id.toString(), mob);
    });

    return allMobs.map((mob) => {
      const mobData = allMobsDataMap.get(mob._id.toString()) || null;

      return {
        mob,
        mobData,
        unixtime: unixtimeResponse.unixtime,
      };
    });
  }

  async findAllAvailableMobs(): Promise<GetMobDtoResponse[]> {
    return this.mobModel.find().select('-__v').lean();
  }

  async updateMob(
    updateMobDtoBody: UpdateMobDtoBodyRequest,
    updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<GetMobDtoResponse> {
    const mob: Mob = await this.mobModel
      .findOneAndUpdate(
        {
          location: updateMobDtoParams.location,
          mobName: updateMobDtoParams.mobName,
        },
        { $set: updateMobDtoBody },
        { new: true },
      )
      .select('-_id -__v')
      .lean()
      .exec();

    return { mob };
  }

  async updateMobByCooldown(
    nickname: string,
    role: RolesTypes,
    updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse> {
    const { mobName, server, location, cooldown } = updateMobByCooldownDto;

    const getMobDto = { mobName, server, location };

    const mob: GetFullMobDtoResponse = await this.findMob(getMobDto, groupName);

    if (mob.mobData.respawnTime === null) {
      throw new BadRequestException(
        'Respawn time is missing. Specify either date of death (dateOfDeath) or date of respawn (dateOfRespawn).',
      );
    }

    const nextResurrectTime: number =
      mob.mob.cooldownTime * cooldown + mob.mobData.respawnTime;

    const history: History = {
      mobName,
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
        { mobId: mob.mobData.mobId, groupName: groupName },
        {
          $inc: { cooldown },
          respawnTime: nextResurrectTime,
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

  async updateMobDateOfDeath(
    nickname: string,
    role: RolesTypes,
    updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse> {
    const { mobName, server, location, dateOfDeath } = updateMobDateOfDeathDto;

    const getMobDto: GetMobDtoRequest = { mobName, server, location };

    const mob: GetFullMobDtoResponse = await this.findMob(getMobDto, groupName);

    const nextResurrectTime: number = dateOfDeath + mob.mob.cooldownTime;

    const history: History = {
      mobName,
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
        { mobId: mob.mobData.mobId, groupName: groupName },
        {
          respawnTime: nextResurrectTime,
          cooldown: 0,
          deathTime: dateOfDeath,
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
    updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse> {
    const { mobName, server, location, dateOfRespawn } =
      updateMobDateOfRespawnDto;

    const getMobDto: GetMobDtoRequest = { mobName, server, location };

    // Fetch mob data to access mob and mobsDataId
    const mob: GetFullMobDtoResponse = await this.findMob(getMobDto, groupName);

    const nextResurrectTime: number = dateOfRespawn;
    const deathTime: number = nextResurrectTime - mob.mob.cooldownTime;
    const adjustedDeathTime: number = deathTime < 0 ? 0 : deathTime;

    const history: History = {
      mobName,
      nickname,
      server,
      groupName,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.updateMobDateOfRespawn,
      toWillResurrect: nextResurrectTime,
    };

    // Update MobsData
    const updatedMobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        { mobId: mob.mobData.mobId, groupName: groupName },
        {
          respawnTime: nextResurrectTime,
          cooldown: 0,
          deathTime: adjustedDeathTime,
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

  async deleteMob(
    deleteMobDtoParams: DeleteMobDtoParamsRequest,
  ): Promise<DeleteMobDtoResponse> {
    const { mobName, location } = deleteMobDtoParams;

    const mob: Mob = await this.mobModel
      .findOneAndDelete(
        {
          location: location,
          mobName: mobName,
        },
        { __v: 0 },
      )
      .exec();

    if (!mob) {
      throw new NotFoundException('Mob not found');
    }

    await this.mobsDataModel.deleteMany({
      mobId: mob._id,
    });

    return { message: 'Mob deleted' };
  }

  async deleteMobFromGroup(
    deleteMobDtoParams: DeleteMobFromGroupDtoParamsRequest,
    groupName: string,
  ): Promise<DeleteMobFromGroupDtoResponse> {
    const { mobName, server, location } = deleteMobDtoParams;

    const getMobDto: GetMobDtoRequest = { mobName, server, location };

    const mob: GetFullMobDtoResponse = await this.findMob(getMobDto, groupName);

    if (!mob) {
      throw new NotFoundException('Mob not found');
    }

    await this.mobsDataModel.deleteOne({
      mobId: mob.mobData.mobId,
      groupName: groupName,
      server: server,
    });

    return { message: 'Mob deleted from group' };
  }

  async crashMobServer(
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
    };

    try {
      await Promise.all([
        this.mobsDataModel.updateMany(
          {
            respawnTime: { $gte: Date.now() },
            mobTypeAdditionalTime: MobsTypes.Босс,
            server: server,
          },
          { $inc: { respawnTime: -300000 } },
        ),
        this.mobsDataModel.updateMany(
          {
            respawnTime: { $gte: Date.now() },
            mobTypeAdditionalTime: MobsTypes.Элитка,
            server: server,
          },
          { $inc: { respawnTime: -18000 } },
        ),
      ]);

      await this.historyService.createHistory(history);

      return this.findAllMobsByUser(email, { server });
    } catch (err) {
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
    const { server, location, mobName } = respawnLostDtoParams;

    const history: History = {
      mobName,
      nickname,
      server,
      groupName,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.respawnLost,
    };

    try {
      const mob: GetFullMobDtoResponse = await this.findMob(
        {
          mobName,
          server,
          location,
        },
        groupName,
      );

      const mobData: MobsData = await this.mobsDataModel
        .findOneAndUpdate(
          { mobId: mob.mobData.mobId, groupName: groupName },
          {
            cooldown: 0,
            respawnTime: null,
            deathTime: null,
            respawnLost: true,
          },
          { new: true },
        )
        .select('-__v')
        .lean()
        .exec();

      await this.historyService.createHistory(history);

      return { mob: mob.mob, mobData };
    } catch (err) {
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
}
