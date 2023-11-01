import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Request } from 'express';
import { HistoryService } from '../history/history.service';
import { UsersService } from '../users/users.service';
import {
  GetBossesDtoRequest,
  GetBossesDtoResponse,
} from './dto/get-bosses.dto';
import {
  UpdateBossDeathDtoRequest,
  UpdateBossDeathDtoResponse,
} from './dto/update-boss-death.dto';
import {
  CreateBossDtoRequest,
  CreateBossDtoResponse,
} from './dto/create-boss.dto';
import {
  UpdateBossDtoBodyRequest,
  UpdateBossDtoBodyResponse,
  UpdateBossDtoParamsRequest,
} from './dto/update-boss.dto';
import { DeleteBossDtoResponse } from './dto/delete-boss.dto';
import { GetBossDtoRequest, GetBossDtoResponse } from './dto/get-boss.dto';
import { GranasBoss, GranasBossDocument } from '../schemas/granasBosses.schema';
import { EnigmaBoss, EnigmaBossDocument } from '../schemas/enigmaBosses.schema';
import { LogrusBoss, LogrusBossDocument } from '../schemas/logrusBosses.schema';
import { Token, TokenDocument } from '../schemas/refreshToken.schema';
import {
  GranasHistory,
  GranasHistoryDocument,
} from '../schemas/granasHistory.schema';
import {
  EnigmaHistory,
  EnigmaHistoryDocument,
} from '../schemas/enigmaHistory.schema';
import {
  LogrusHistory,
  LogrusHistoryDocument,
} from '../schemas/logrusHistory.schema';
import { History } from '../interfaces/history.interface';
import { BossTypes, Servers } from '../schemas/mobs.enum';
import { HelperClass } from '../helper-class';
import {
  UpdateBossCooldownDtoRequest,
  UpdateBossCooldownDtoResponse,
} from './dto/update-boss-cooldown.dto';

@Injectable()
export class BossesService {
  private bossModels: any;
  private historyModels: any;
  public getNicknameFromToken(request: Request): any {
    return HelperClass.getNicknameFromToken(request, this.jwtService);
  }
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(GranasBoss.name)
    private granasBossModel: Model<GranasBossDocument>,
    @InjectModel(EnigmaBoss.name)
    private enigmaBossModel: Model<EnigmaBossDocument>,
    @InjectModel(LogrusBoss.name)
    private logrusBossModel: Model<LogrusBossDocument>,
    @InjectModel(GranasHistory.name)
    private granasHistoryModel: Model<GranasHistoryDocument>,
    @InjectModel(EnigmaHistory.name)
    private enigmaHistoryModel: Model<EnigmaHistoryDocument>,
    @InjectModel(LogrusHistory.name)
    private logrusHistoryModel: Model<LogrusHistoryDocument>,
    private usersService: UsersService,
    private historyService: HistoryService,
    private readonly jwtService: JwtService,
  ) {
    this.bossModels = [
      { server: 'Гранас', model: this.granasBossModel },
      { server: 'Логрус', model: this.logrusBossModel },
      { server: 'Энигма', model: this.enigmaBossModel },
    ];

    this.historyModels = [
      { server: 'Гранас', model: this.granasHistoryModel },
      { server: 'Логрус', model: this.enigmaHistoryModel },
      { server: 'Энигма', model: this.logrusHistoryModel },
    ];
  }

  async createBoss(
    createBossDto: CreateBossDtoRequest,
  ): Promise<CreateBossDtoResponse> {
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

    try {
      const boss = await bossModel
        .findOne({ bossName: getBossDto.bossName }, { __v: 0 })
        .lean()
        .exec();
      if (!boss?._id) {
        throw new BadRequestException();
      }

      return boss;
    } catch (error) {
      throw new BadRequestException('Boss not found');
    }
  }

  async findAllBossesByUser(
    email: string,
    getBossesDtoRequest: GetBossesDtoRequest,
  ): Promise<GetBossesDtoResponse[]> {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === getBossesDtoRequest.server,
    ).model;
    const { excludedBosses, unavailableBosses } =
      await this.usersService.findUser(email);

    const undisplayedBosses = excludedBosses.concat(
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
  ): Promise<UpdateBossDtoBodyResponse> {
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

  async updateDeathOfBoss(
    request: Request,
    updateBossDeathDto: UpdateBossDeathDtoRequest,
  ): Promise<UpdateBossDeathDtoResponse> {
    if (updateBossDeathDto.dateOfDeath && updateBossDeathDto.dateOfRespawn) {
      throw new BadRequestException(
        'dateOfDeath and dateOfRespawn should not be together',
      );
    }

    const nickname = this.getNicknameFromToken(request);
    const getBossDto = {
      bossName: updateBossDeathDto.bossName,
      server: updateBossDeathDto.server,
    };

    const bossModel = this.bossModels.find(
      // Finding the boss database by server
      (obj) => obj.server === updateBossDeathDto.server,
    ).model;

    const boss: GetBossDtoResponse = await this.findBoss(getBossDto); // Get the boss we're updating

    const history: History = {
      bossName: updateBossDeathDto.bossName,
      nickname: nickname,
      server: updateBossDeathDto.server,
      date: Date.now(),
    };

    if (!updateBossDeathDto.dateOfDeath && !updateBossDeathDto.dateOfRespawn) {
      // If the boss died at a certain time not now.
      let nextResurrectTime: number = boss.cooldownTime;
      history.toWillResurrect = nextResurrectTime;
      history.fromCooldown = boss.cooldown;
      history.toCooldown = ++boss.cooldown;
      await this.historyService.createHistory(history);

      return bossModel
        .findOneAndUpdate(
          // Add +1 to the cooldown counter and update the respawn on cd
          { bossName: boss.bossName },
          { $inc: { cooldown: 1, respawnTime: nextResurrectTime } },
          { new: true },
        )
        .select('-__v')
        .lean()
        .exec();
    }

    if (updateBossDeathDto.dateOfRespawn) {
      // If we now know the exact time of the boss respawn.
      let nextResurrectTime = updateBossDeathDto.dateOfRespawn;
      history.toWillResurrect = nextResurrectTime;
      await this.historyService.createHistory(history);

      return bossModel
        .findOneAndUpdate(
          // Update the respawn at the exact time of respawn.
          { bossName: boss.bossName },
          { respawnTime: nextResurrectTime, cooldown: 0 },
          { new: true },
        )
        .select('-__v')
        .lean()
        .exec();
    }

    let nextResurrectTime: number =
      updateBossDeathDto.dateOfDeath + boss.cooldownTime; // If the boss is dead now.
    history.toWillResurrect = nextResurrectTime;
    await this.historyService.createHistory(history);

    return bossModel
      .findOneAndUpdate(
        // Update the respawn at the exact time of death.
        { bossName: boss.bossName },
        { respawnTime: nextResurrectTime, cooldown: 0 },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }

  async updateCooldownCounterBoss(
    updateBossCooldownDtoRequest: UpdateBossCooldownDtoRequest,
  ): Promise<UpdateBossCooldownDtoResponse> {
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
  ): Promise<GetBossesDtoResponse[]> {
    const nickname = this.getNicknameFromToken(request);

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
}
