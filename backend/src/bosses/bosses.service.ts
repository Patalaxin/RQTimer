import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Request } from 'express';
import { HistoryService } from '../history/history.service';
import { UsersService } from '../users/users.service';
import { GetBossesDtoRequest } from './dto/get-bosses.dto';
import { CreateBossDtoRequest } from './dto/create-boss.dto';
import {
  UpdateBossDtoBodyRequest,
  UpdateBossDtoParamsRequest,
} from './dto/update-boss.dto';
import { DeleteBossDtoResponse } from './dto/delete-boss.dto';
import { GetBossDtoRequest, GetBossDtoResponse } from './dto/get-boss.dto';
import { GranasBoss, GranasBossDocument } from '../schemas/granasBosses.schema';
import { EnigmaBoss, EnigmaBossDocument } from '../schemas/enigmaBosses.schema';
import { LogrusBoss, LogrusBossDocument } from '../schemas/logrusBosses.schema';
import { History } from '../interfaces/history.interface';
import { BossTypes, Servers } from '../schemas/mobs.enum';
import { HelperClass } from '../helper-class';
import { UpdateBossCooldownDtoRequest } from './dto/update-boss-cooldown.dto';
import { TelegramBotService } from '../telegramBot/bot.service';
import { UpdateBossByCooldownDtoRequest } from './dto/update-boss-by-cooldown.dto';
import { UpdateBossDateOfDeathDtoRequest } from './dto/update-boss-date-of-death.dto';
import { UpdateBossDateOfRespawnDtoRequest } from './dto/update-boss-date-of-respawn.dto';

@Injectable()
export class BossesService {
  private bossModels: any;

  constructor(
    @InjectModel(GranasBoss.name)
    private granasBossModel: Model<GranasBossDocument>,
    @InjectModel(EnigmaBoss.name)
    private enigmaBossModel: Model<EnigmaBossDocument>,
    @InjectModel(LogrusBoss.name)
    private logrusBossModel: Model<LogrusBossDocument>,
    private usersService: UsersService,
    private historyService: HistoryService,
    private botService: TelegramBotService,
    private jwtService: JwtService,
  ) {
    this.bossModels = [
      { server: 'Гранас', model: this.granasBossModel },
      { server: 'Логрус', model: this.logrusBossModel },
      { server: 'Энигма', model: this.enigmaBossModel },
    ];
  }

  async createBoss(
    createBossDto: CreateBossDtoRequest,
  ): Promise<GetBossDtoResponse> {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === createBossDto.server,
    ).model;

    try {
      const newBoss = await bossModel.create(createBossDto);
      await newBoss.save();
      return newBoss.toObject();
    } catch (err) {
      throw new BadRequestException(
        'Something went wrong. Probably this boss already exist in this location',
      );
    }
  }

  async findBoss(getBossDto: GetBossDtoRequest): Promise<GetBossDtoResponse> {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === getBossDto.server,
    ).model;

    if (!Object.values(Servers).includes(getBossDto.server)) {
      throw new BadRequestException('Not valid server');
    }

    if (!Object.values(BossTypes).includes(getBossDto.bossName)) {
      throw new BadRequestException('Not valid boss name');
    }

    const boss = await bossModel
      .findOne({ bossName: getBossDto.bossName }, { __v: 0 })
      .lean()
      .exec();
    if (!boss?._id) {
      throw new BadRequestException('Boss not found');
    }

    return boss;
  }

  async findAllBossesByUser(
    email: string,
    getBossesDtoRequest: GetBossesDtoRequest,
  ): Promise<GetBossDtoResponse[]> {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === getBossesDtoRequest.server,
    ).model;
    const { excludedBosses, unavailableBosses } =
      await this.usersService.findUser(email);

    const undisplayedBosses: string[] = excludedBosses.concat(
      unavailableBosses.filter((item) => excludedBosses.indexOf(item) === -1),
    );

    const arrayOfObjectsUndisplayedBosses = undisplayedBosses.map((item) => ({
      bossName: item,
    }));
    arrayOfObjectsUndisplayedBosses.push({ bossName: 'Mocked Name of Boss' }); // coz $nor doesn't work with empty array

    return bossModel
      .find({ $nor: arrayOfObjectsUndisplayedBosses }, { __v: 0 })
      .lean()
      .exec();
  }

  async updateBoss(
    updateBossDtoParamsRequest: UpdateBossDtoParamsRequest,
    updateBossDto: UpdateBossDtoBodyRequest,
  ): Promise<GetBossDtoResponse> {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === updateBossDtoParamsRequest.server,
    ).model;
    return await bossModel
      .findOneAndUpdate(
        { bossName: updateBossDtoParamsRequest.bossName },
        { $set: updateBossDto },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }

  async updateBossByCooldown(
    request: Request,
    updateBossByCooldownDto: UpdateBossByCooldownDtoRequest,
  ): Promise<GetBossDtoResponse> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    const getBossDto = {
      bossName: updateBossByCooldownDto.bossName,
      server: updateBossByCooldownDto.server,
    };

    const bossModel = this.bossModels.find(
      // Finding the boss database by server
      (obj) => obj.server === updateBossByCooldownDto.server,
    ).model;

    const boss: GetBossDtoResponse = await this.findBoss(getBossDto);
    const timeoutName: string = await HelperClass.generateUniqueName();

    if (boss.respawnTime === null) {
      throw new BadRequestException(
        'Respawn is lost, so it is not possible to update on a cooldown. Some date of death (dateOfDeath) or date of respawn (dateOfRespawn) must be specified',
      );
    }

    const history: History = {
      bossName: updateBossByCooldownDto.bossName,
      nickname: nickname,
      server: updateBossByCooldownDto.server,
      date: Date.now(),
    };

    let nextResurrectTime: number = boss.cooldownTime;
    history.toWillResurrect = nextResurrectTime;
    history.fromCooldown = boss.cooldown;
    history.toCooldown = ++boss.cooldown;
    await this.historyService.createHistory(history);
    const previousRespawnTime: number = boss.respawnTime;

    await this.botService.newTimeout(
      timeoutName,
      boss.respawnTime + nextResurrectTime,
      updateBossByCooldownDto.bossName,
      updateBossByCooldownDto.server,
    );

    return bossModel
      .findOneAndUpdate(
        // Add +1 to the cooldown counter and update the respawn/death times
        { bossName: boss.bossName },
        {
          $inc: { cooldown: 1, respawnTime: nextResurrectTime },
          deathTime: previousRespawnTime,
          respawnLost: false,
        },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }

  async updateBossDateOfDeath(
    request: Request,
    updateBossDateOfDeathDto: UpdateBossDateOfDeathDtoRequest,
  ): Promise<GetBossDtoResponse> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    const getBossDto = {
      bossName: updateBossDateOfDeathDto.bossName,
      server: updateBossDateOfDeathDto.server,
    };

    const bossModel = this.bossModels.find(
      // Finding the boss database by server
      (obj) => obj.server === updateBossDateOfDeathDto.server,
    ).model;

    const boss: GetBossDtoResponse = await this.findBoss(getBossDto); // Get the boss we're updating
    const timeoutName: string = await HelperClass.generateUniqueName();

    const history: History = {
      bossName: updateBossDateOfDeathDto.bossName,
      nickname: nickname,
      server: updateBossDateOfDeathDto.server,
      date: Date.now(),
    };

    let nextResurrectTime: number =
      updateBossDateOfDeathDto.dateOfDeath + boss.cooldownTime; // If the boss is dead now.
    history.toWillResurrect = nextResurrectTime;
    await this.historyService.createHistory(history);

    await this.botService.newTimeout(
      timeoutName,
      nextResurrectTime,
      updateBossDateOfDeathDto.bossName,
      updateBossDateOfDeathDto.server,
    );

    return bossModel
      .findOneAndUpdate(
        // Update the respawn at the exact time of death.
        { bossName: boss.bossName },
        {
          respawnTime: nextResurrectTime,
          cooldown: 0,
          deathTime: updateBossDateOfDeathDto.dateOfDeath,
          respawnLost: false,
        },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }

  async updateBossDateOfRespawn(
    request: Request,
    updateBossDateOfRespawnDto: UpdateBossDateOfRespawnDtoRequest,
  ): Promise<GetBossDtoResponse> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    const getBossDto = {
      bossName: updateBossDateOfRespawnDto.bossName,
      server: updateBossDateOfRespawnDto.server,
    };

    const bossModel = this.bossModels.find(
      // Finding the boss database by server
      (obj) => obj.server === updateBossDateOfRespawnDto.server,
    ).model;

    const boss: GetBossDtoResponse = await this.findBoss(getBossDto); // Get the boss we're updating
    const timeoutName: string = await HelperClass.generateUniqueName();

    const history: History = {
      bossName: updateBossDateOfRespawnDto.bossName,
      nickname: nickname,
      server: updateBossDateOfRespawnDto.server,
      date: Date.now(),
    };

    let nextResurrectTime: number = updateBossDateOfRespawnDto.dateOfRespawn;
    history.toWillResurrect = nextResurrectTime;
    await this.historyService.createHistory(history);
    const deathTime: number = nextResurrectTime - boss.cooldownTime;
    const adjustedDeathTime: number = deathTime < 0 ? 0 : deathTime;

    await this.botService.newTimeout(
      timeoutName,
      updateBossDateOfRespawnDto.dateOfRespawn,
      updateBossDateOfRespawnDto.bossName,
      updateBossDateOfRespawnDto.server,
    );

    return bossModel
      .findOneAndUpdate(
        // Update the respawn at the exact time of respawn.
        { bossName: boss.bossName },
        {
          respawnTime: nextResurrectTime,
          cooldown: 0,
          deathTime: adjustedDeathTime,
          respawnLost: false,
        },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }

  async updateCooldownCounterBoss(
    updateBossCooldownDtoRequest: UpdateBossCooldownDtoRequest,
  ): Promise<GetBossDtoResponse> {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === updateBossCooldownDtoRequest.server,
    ).model;

    try {
      return await bossModel
        .findOneAndUpdate(
          { bossName: updateBossCooldownDtoRequest.bossName },
          { cooldown: updateBossCooldownDtoRequest.cooldown },
          { new: true },
        )
        .select('-__v')
        .lean()
        .exec();
    } catch (err) {
      throw new BadRequestException('Something went wrong!');
    }
  }

  async crashBossServer(
    request: Request,
    server: Servers,
  ): Promise<GetBossDtoResponse[]> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );

    try {
      const bossModel = this.bossModels.find(
        (obj) => obj.server === server,
      ).model;

      const history: History = {
        bossName: BossTypes.Все,
        nickname: nickname,
        server: server,
        date: Date.now(),
      };

      history.crashServer = true;
      await this.historyService.createHistory(history);

      await bossModel.updateMany(
        { respawnTime: { $gte: Date.now() } },
        { $inc: { respawnTime: -300000 } },
      ); // minus 5 minutes

      return await bossModel.find({}).select('-__v').lean().exec();
    } catch (err) {
      throw new BadRequestException('Something went wrong!!!');
    }
  }

  async deleteBoss(
    server: Servers,
    bossName: BossTypes,
  ): Promise<DeleteBossDtoResponse> {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === server,
    ).model;
    await bossModel.deleteOne({ bossName: bossName });
    return { message: 'Boss deleted' };
  }

  async respawnLost(
    server: Servers,
    bossName: BossTypes,
  ): Promise<GetBossDtoResponse[]> {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === server,
    ).model;

    return await bossModel
      .findOneAndUpdate(
        { bossName: bossName },
        { cooldown: 0, respawnTime: null, deathTime: null, respawnLost: true },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }
}
