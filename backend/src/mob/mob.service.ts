import { BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { TelegramBotService } from '../telegramBot/bot.service';
import { IMob } from '../domain/mob/mob.interface';
import { CreateMobDtoRequest } from './dto/create-mob.dto';
import { Mob, MobDocument } from '../schemas/mob.schema';
import { MobsData, MobsDataDocument } from '../schemas/mobsData.schema';
import {
  GetFullMobDtoResponse,
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
import { History } from '../interfaces/history.interface';
import { HistoryService } from '../history/history.service';
import { UpdateMobDateOfDeathDtoRequest } from './dto/update-mob-date-of-death.dto';
import { UpdateMobDateOfRespawnDtoRequest } from './dto/update-mob-date-of-respawn.dto';
import { UpdateMobCooldownDtoRequest } from './dto/update-mob-cooldown.dto';
import { MobName, Servers } from '../schemas/mobs.enum';
import {
  DeleteMobDtoParamsRequest,
  DeleteMobDtoResponse,
} from './dto/delete-mob.dto';
import { RespawnLostDtoParamsRequest } from "./dto/respawn-lost.dto";

export class MobService implements IMob {
  constructor(
    @InjectModel(Mob.name)
    private mobModel: Model<MobDocument>,
    @InjectModel(MobsData.name)
    private mobsDataModel: Model<MobsDataDocument>,
    private usersService: UsersService,
    private historyService: HistoryService,
    private botService: TelegramBotService,
  ) {}

  async createMob(
    createMobDto: CreateMobDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    try {
      const mobData = await this.mobsDataModel.create({});
      const mob = await this.mobModel.create({
        ...createMobDto,
        mobsDataId: mobData._id,
      });
      await mob.save();
      return { mob: mob.toObject(), mobData: mobData.toObject() };
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async findMob(getMobDto: GetMobDtoRequest): Promise<GetFullMobDtoResponse> {
    const mob: Mob = await this.mobModel
      .findOne(
        {
          mobName: getMobDto.mobName,
          server: getMobDto.server,
          location: getMobDto.location,
        },
        { __v: 0 },
      )
      .lean()
      .exec();
    if (!mob) {
      throw new BadRequestException('Mob not found');
    }

    const mobData: MobsData = await this.mobsDataModel
      .findOne({ _id: mob.mobsDataId }, { __v: 0 })
      .lean()
      .exec();
    if (!mobData) {
      throw new BadRequestException('Mob data not found');
    }

    return {
      mob,
      mobData,
    };
  }

  async findAllMobsByUser(
    email: string,
    getMobsDto: GetMobsDtoRequest,
  ): Promise<GetFullMobDtoResponse[]> {
    const { excludedMobs, unavailableMobs } =
      await this.usersService.findUser(email);

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
    if (!mobs) {
      throw new BadRequestException('No mobs found for the given server');
    }
    const mobDataPromises = mobs.map(async (mob) => {
      const mobData: MobsData = await this.mobsDataModel
        .findOne({ _id: mob.mobsDataId }, { __v: 0, _id: 0 })
        .lean()
        .exec();

      if (!mobData) {
        throw new BadRequestException('Mob data not found');
      }

      return { mob, mobData };
    });

    return await Promise.all(mobDataPromises);
  }

  async updateMob(
    updateMobDtoBody: UpdateMobDtoBodyRequest,
    updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<GetMobDtoResponse> {
    const mob: Mob = await this.mobModel
      .findOneAndUpdate(
        {
          mobName: updateMobDtoParams.mobName,
          server: updateMobDtoParams.server,
          location: updateMobDtoParams.location,
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
    updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const getMobDto = {
      mobName: updateMobByCooldownDto.mobName,
      server: updateMobByCooldownDto.server,
      location: updateMobByCooldownDto.location,
    };

    const mob: GetFullMobDtoResponse = await this.findMob(getMobDto);
    const timeoutName: string = await HelperClass.generateUniqueName();

    if (mob.mobData.respawnTime === null) {
      throw new BadRequestException(
        'Respawn is lost, so it is not possible to update on a cooldown. Some date of death (dateOfDeath) or date of respawn (dateOfRespawn) must be specified',
      );
    }

    const history: History = {
      mobName: updateMobByCooldownDto.mobName,
      nickname: nickname,
      server: updateMobByCooldownDto.server,
      date: Date.now(),
    };

    const nextResurrectTime: number = mob.mob.cooldownTime;
    history.toWillResurrect = nextResurrectTime;
    history.fromCooldown = mob.mobData.cooldown;
    history.toCooldown = ++mob.mobData.cooldown;
    await this.historyService.createHistory(history);
    const previousRespawnTime: number = mob.mobData.respawnTime;

    await this.botService.newTimeout(
      timeoutName,
      mob.mobData.respawnTime + nextResurrectTime,
      updateMobByCooldownDto.mobName,
      updateMobByCooldownDto.server,
    );

    const mobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        // Add +1 to the cooldown counter and update the respawn/death times
        { _id: mob.mob.mobsDataId },
        {
          $inc: { cooldown: 1, respawnTime: nextResurrectTime },
          deathTime: previousRespawnTime,
          respawnLost: false,
        },
        { new: true },
      )
      .select('-_id -__v')
      .lean()
      .exec();

    return { mobData };
  }

  async updateMobDateOfDeath(
    nickname: string,
    updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const getMobDto: GetMobDtoRequest = {
      mobName: updateMobDateOfDeathDto.mobName,
      server: updateMobDateOfDeathDto.server,
      location: updateMobDateOfDeathDto.location,
    };

    const mob: GetMobDtoResponse = await this.findMob(getMobDto);
    const timeoutName: string = await HelperClass.generateUniqueName();

    const history: History = {
      mobName: updateMobDateOfDeathDto.mobName,
      nickname: nickname,
      server: updateMobDateOfDeathDto.server,
      date: Date.now(),
    };

    const nextResurrectTime: number =
      updateMobDateOfDeathDto.dateOfDeath + mob.mob.cooldownTime; // If the mob is dead now.
    history.toWillResurrect = nextResurrectTime;
    await this.historyService.createHistory(history);

    await this.botService.newTimeout(
      timeoutName,
      nextResurrectTime,
      updateMobDateOfDeathDto.mobName,
      updateMobDateOfDeathDto.server,
    );
    const mobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        // Update the respawn at the exact time of death.
        { _id: mob.mob.mobsDataId },
        {
          respawnTime: nextResurrectTime,
          cooldown: 0,
          deathTime: updateMobDateOfDeathDto.dateOfDeath,
          respawnLost: false,
        },
        { new: true },
      )
      .select('-_id -__v')
      .lean()
      .exec();

    return { mobData };
  }

  async updateMobDateOfRespawn(
    nickname: string,
    updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const getMobDto: GetMobDtoRequest = {
      mobName: updateMobDateOfRespawnDto.mobName,
      server: updateMobDateOfRespawnDto.server,
      location: updateMobDateOfRespawnDto.location,
    };

    const mob: GetMobDtoResponse = await this.findMob(getMobDto); // Get the mob we're updating
    const timeoutName: string = await HelperClass.generateUniqueName();

    const history: History = {
      mobName: updateMobDateOfRespawnDto.mobName,
      nickname: nickname,
      server: updateMobDateOfRespawnDto.server,
      date: Date.now(),
    };

    const nextResurrectTime: number = updateMobDateOfRespawnDto.dateOfRespawn;
    history.toWillResurrect = nextResurrectTime;
    await this.historyService.createHistory(history);
    const deathTime: number = nextResurrectTime - mob.mob.cooldownTime;
    const adjustedDeathTime: number = deathTime < 0 ? 0 : deathTime;

    await this.botService.newTimeout(
      timeoutName,
      updateMobDateOfRespawnDto.dateOfRespawn,
      updateMobDateOfRespawnDto.mobName,
      updateMobDateOfRespawnDto.server,
    );

    const mobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        // Update the respawn at the exact time of respawn.
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

    return { mobData };
  }

  async updateMobCooldownCounter(
    updateMobCooldownDto: UpdateMobCooldownDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const getMobDto: GetMobDtoRequest = {
      mobName: updateMobCooldownDto.mobName,
      server: updateMobCooldownDto.server,
      location: updateMobCooldownDto.location,
    };
    const mob: GetMobDtoResponse = await this.findMob(getMobDto); // Get the mob we're updating

    const mobData = await this.mobsDataModel
      .findOneAndUpdate(
        { _id: mob.mob.mobsDataId },
        { cooldown: updateMobCooldownDto.cooldown },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();

    return { mobData };
  }

  async deleteMob(
    deleteMobDtoParams: DeleteMobDtoParamsRequest,
  ): Promise<DeleteMobDtoResponse> {
    const getMobDto: GetMobDtoRequest = {
      mobName: deleteMobDtoParams.mobName,
      server: deleteMobDtoParams.server,
      location: deleteMobDtoParams.location,
    };

    const mob: GetMobDtoResponse = await this.findMob(getMobDto); // Get the mob we're updating
    await this.mobModel.deleteOne({
      mobName: mob.mob.mobName,
      server: mob.mob.server,
      location: mob.mob.location,
    });
    await this.mobsDataModel.deleteOne({ _id: mob.mob.mobsDataId });
    return { message: 'Mob deleted' };
  }

  async crashMobServer(
    email: string,
    nickname: string,
    server: Servers,
  ): Promise<GetFullMobDtoResponse[]> {
    try {
      const history: History = {
        mobName: MobName.Все,
        nickname: nickname,
        server: server,
        date: Date.now(),
      };

      history.crashServer = true;
      await this.historyService.createHistory(history);

      await this.mobsDataModel
        .updateMany(
          { respawnTime: { $gte: Date.now() } },
          { $inc: { respawnTime: -300000 } },
        )
        .lean()
        .exec(); // minus 5 minutes

      return await this.findAllMobsByUser(email, { server });
    } catch (err) {
      throw new BadRequestException('Something went wrong!!!');
    }
  }

  async respawnLost(
    respawnLostDtoParams: RespawnLostDtoParamsRequest
  ): Promise<GetMobDataDtoResponse> {
    const getMobDto: GetMobDtoRequest = {
      mobName: respawnLostDtoParams.mobName,
      server: respawnLostDtoParams.server,
      location: respawnLostDtoParams.location,
    };

    const mob: GetMobDtoResponse = await this.findMob(getMobDto); // Get the mob we're updating
    const mobData: MobsData = await this.mobsDataModel
      .findOneAndUpdate(
        { _id: mob.mob.mobsDataId },
        { cooldown: 0, respawnTime: null, deathTime: null, respawnLost: true },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();

    return { mobData };
  }
}
