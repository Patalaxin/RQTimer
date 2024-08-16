import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { TelegramBotService } from '../telegramBot/bot.service';
import { IMob } from './mob.interface';
import { CreateMobDtoRequest } from './dto/create-mob.dto';
import { Mob, MobDocument } from '../schemas/mob.schema';
import { MobsData, MobsDataDocument } from '../schemas/mobsData.schema';
import {
  GetFullMobDtoResponse,
  GetFullMobWithUnixDtoResponse,
  GetMobDataDtoResponse,
  GetMobDtoRequest,
  GetMobDtoResponse,
} from './dto/get-mob.dto';
import { GetMobsDtoRequest } from './dto/get-all-mobs.dto';
import {
  UpdateMobDtoBodyRequest,
  UpdateMobDtoParamsRequest,
} from './dto/update-mob.dto';
import { UpdateMobByCooldownDtoRequest } from './dto/update-mob-by-cooldown.dto';
import { HelperClass } from '../helper-class';
import { History, HistoryTypes } from '../history/history.interface';
import { HistoryService } from '../history/history.service';
import { UpdateMobDateOfDeathDtoRequest } from './dto/update-mob-date-of-death.dto';
import { UpdateMobDateOfRespawnDtoRequest } from './dto/update-mob-date-of-respawn.dto';
import { MobName, MobsTypes, Servers } from '../schemas/mobs.enum';
import {
  DeleteMobDtoParamsRequest,
  DeleteMobDtoResponse,
} from './dto/delete-mob.dto';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import { RolesTypes } from '../schemas/user.schema';
import { UnixtimeService } from '../unixtime/unixtime.service';

export class MobService implements IMob {
  constructor(
    @InjectModel(Mob.name)
    private mobModel: Model<MobDocument>,
    @InjectModel(MobsData.name)
    private mobsDataModel: Model<MobsDataDocument>,
    private usersService: UsersService,
    private historyService: HistoryService,
    private botService: TelegramBotService,
    private readonly unixtimeService: UnixtimeService,
  ) {}

  async createMob(
    createMobDto: CreateMobDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    try {
      const mobData = await this.mobsDataModel.create({
        mobTypeAdditionalTime: createMobDto.mobType,
      });
      const mob = await this.mobModel.create({
        ...createMobDto,
        mobsDataId: mobData._id,
      });
      await mob.save();
      return { mob: mob.toObject(), mobData: mobData.toObject() };
    } catch (err) {
      if (err.code === 11000) {
        // Handle unique constraint error
        throw new BadRequestException(
          'A mob with the same name already exists in this location on this server.',
        );
      }
      throw new BadRequestException(err);
    }
  }

  async findMob(
    getMobDto: GetMobDtoRequest,
  ): Promise<GetFullMobWithUnixDtoResponse> {
    const mob = await this.mobModel
      .findOne(
        {
          mobName: getMobDto.server,
          server: getMobDto.location,
          location: getMobDto.mobName,
        },
        { __v: 0, _id: 0 },
      )
      .lean()
      .exec();

    if (!mob) {
      throw new BadRequestException('Mob not found');
    }

    const [mobData, unixtimeResponse] = await Promise.all([
      this.mobsDataModel
        .findOne({ _id: mob.mobsDataId }, { __v: 0, _id: 0 })
        .lean()
        .exec()
        .then((mobData) => {
          if (!mobData) {
            throw new BadRequestException('Mob data not found');
          }
          return mobData;
        }),

      this.unixtimeService.getUnixTime(),
    ]);

    return {
      mob,
      mobData,
      unixtime: unixtimeResponse.unixTime,
    };
  }

  async findAllMobsByUser(
    email: string,
    getMobsDto: GetMobsDtoRequest,
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    const [userData, unixtimeResponse] = await Promise.all([
      this.usersService.findUser(email),
      this.unixtimeService.getUnixTime(),
    ]);

    const { excludedMobs, unavailableMobs } = userData;

    const undisplayedMobs: string[] = excludedMobs.concat(
      unavailableMobs.filter((item) => excludedMobs.indexOf(item) === -1),
    );

    const arrayOfObjectsUndisplayedMob = undisplayedMobs.map((item) => ({
      mobName: item,
    }));
    arrayOfObjectsUndisplayedMob.push({ mobName: 'Mocked Name of Mob' }); // coz $nor doesn't work with empty array

    const mobs: Mob[] = await this.mobModel
      .find(
        { server: getMobsDto.server, $nor: arrayOfObjectsUndisplayedMob },
        { __v: 0, _id: 0 },
      )
      .lean()
      .exec();

    const mobDataIds = mobs.map((mob) => mob.mobsDataId).filter(Boolean);

    const mobsData: MobsData[] = await this.mobsDataModel
      .find({ _id: { $in: mobDataIds } }, { __v: 0 })
      .lean()
      .exec();

    const mobsDataMap = new Map<string, MobsData>();
    mobsData.forEach((data) => {
      mobsDataMap.set(data._id.toString(), data);
    });

    return mobs.map((mob) => {
      const mobData = mobsDataMap.get(mob.mobsDataId?.toString() || '');

      if (!mobData) {
        throw new BadRequestException(
          `Mob data not found for mob ${mob.mobName}`,
        );
      }

      return {
        mob,
        mobData,
        unixtime: unixtimeResponse.unixTime,
      };
    });
  }

  async updateMob(
    updateMobDtoBody: UpdateMobDtoBodyRequest,
    updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<GetMobDtoResponse> {
    const mob: Mob = await this.mobModel
      .findOneAndUpdate(
        {
          mobName: updateMobDtoParams.server,
          server: updateMobDtoParams.location,
          location: updateMobDtoParams.mobName,
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
  ): Promise<GetMobDataDtoResponse> {
    const { mobName, server, location, cooldown } = updateMobByCooldownDto;

    const getMobDto = { mobName, server, location };

    const mob: GetFullMobDtoResponse = await this.findMob(getMobDto);

    if (mob.mobData.respawnTime === null) {
      throw new BadRequestException(
        'Respawn time is missing. Specify either date of death (dateOfDeath) or date of respawn (dateOfRespawn).',
      );
    }

    const timeoutName: string = await HelperClass.generateUniqueName();

    const nextResurrectTime: number =
      mob.mob.cooldownTime * cooldown + mob.mobData.respawnTime;

    const history: History = {
      mobName,
      nickname,
      server,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.updateMobByCooldown,
      toWillResurrect: nextResurrectTime,
      fromCooldown: mob.mobData.cooldown,
      toCooldown: mob.mobData.cooldown + cooldown,
    };

    const updatedMobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        { _id: mob.mob.mobsDataId },
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

    await Promise.all([
      this.historyService.createHistory(history),
      this.botService.newTimeout(
        timeoutName,
        nextResurrectTime,
        mobName,
        location,
        server,
      ),
    ]);

    return { mobData: updatedMobData };
  }

  async updateMobDateOfDeath(
    nickname: string,
    role: RolesTypes,
    updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const { mobName, server, location, dateOfDeath } = updateMobDateOfDeathDto;

    const getMobDto: GetMobDtoRequest = { mobName, server, location };

    const mob: GetMobDtoResponse = await this.findMob(getMobDto);

    const timeoutName: string = await HelperClass.generateUniqueName();

    const nextResurrectTime: number = dateOfDeath + mob.mob.cooldownTime;

    const history: History = {
      mobName,
      nickname,
      server,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.updateMobDateOfDeath,
      toWillResurrect: nextResurrectTime,
    };

    const updatedMobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        { _id: mob.mob.mobsDataId },
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

    await Promise.all([
      this.historyService.createHistory(history),
      this.botService.newTimeout(
        timeoutName,
        nextResurrectTime,
        mobName,
        location,
        server,
      ),
    ]);

    return { mobData: updatedMobData };
  }

  async updateMobDateOfRespawn(
    nickname: string,
    role: RolesTypes,
    updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const { mobName, server, location, dateOfRespawn } =
      updateMobDateOfRespawnDto;

    const getMobDto: GetMobDtoRequest = { mobName, server, location };

    const mob: GetMobDtoResponse = await this.findMob(getMobDto);

    const timeoutName: string = await HelperClass.generateUniqueName();

    const nextResurrectTime: number = dateOfRespawn;
    const deathTime: number = nextResurrectTime - mob.mob.cooldownTime;
    const adjustedDeathTime: number = deathTime < 0 ? 0 : deathTime;

    const history: History = {
      mobName,
      nickname,
      server,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.updateMobDateOfRespawn,
      toWillResurrect: nextResurrectTime,
    };

    const updatedMobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        { _id: mob.mob.mobsDataId },
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

    await Promise.all([
      this.historyService.createHistory(history),
      this.botService.newTimeout(
        timeoutName,
        nextResurrectTime,
        mobName,
        location,
        server,
      ),
    ]);

    return { mobData: updatedMobData };
  }

  async deleteMob(
    deleteMobDtoParams: DeleteMobDtoParamsRequest,
  ): Promise<DeleteMobDtoResponse> {
    const { mobName, server, location } = deleteMobDtoParams;

    const getMobDto: GetMobDtoRequest = { mobName, server, location };

    const mob: GetMobDtoResponse = await this.findMob(getMobDto);

    if (!mob) {
      throw new NotFoundException('Mob not found');
    }

    await Promise.all([
      this.mobModel.deleteOne({
        mobName: mob.mob.server,
        server: mob.mob.location,
        location: mob.mob.mobName,
      }),
      this.mobsDataModel.deleteOne({ _id: mob.mob.mobsDataId }),
    ]);

    return { message: 'Mob deleted' };
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
          },
          { $inc: { respawnTime: -300000 } },
        ),
        this.mobsDataModel.updateMany(
          {
            respawnTime: { $gte: Date.now() },
            mobTypeAdditionalTime: MobsTypes.Элитка,
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
  ): Promise<GetMobDataDtoResponse> {
    const { server, location, mobName } = respawnLostDtoParams;

    const history: History = {
      mobName,
      nickname,
      server,
      date: Date.now(),
      role,
      historyTypes: HistoryTypes.respawnLost,
    };

    try {
      const mob: GetMobDtoResponse = await this.findMob({
        mobName,
        server,
        location,
      });

      const mobData: MobsData = await this.mobsDataModel
        .findOneAndUpdate(
          { _id: mob.mob.mobsDataId },
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

      return { mobData };
    } catch (err) {
      throw new BadRequestException('Failed to process respawn lost.');
    }
  }
}
