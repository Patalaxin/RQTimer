import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from "@nestjs/jwt";
import { Model } from 'mongoose';
import { Request } from "express";
import { HistoryService } from '../history/history.service';
import { UsersService } from '../users/users.service';
import { CreateBossDto } from './dto/create-boss.dto';
import { UpdateBossDto } from './dto/update-boss.dto';
import { GetBossDto } from './dto/get-boss.dto';
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
import { BossTypes, Servers } from '../schemas/bosses.enum';
import { History } from "../interfaces/history.interface";

@Injectable()
export class BossesService {
  private bossModels: any;
  private historyModels: any;
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
    private readonly jwtService: JwtService
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

  async createBoss(createBossDto: CreateBossDto) {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === createBossDto.server,
    ).model;

    const newBoss = await bossModel.create(createBossDto);
    await newBoss.save();
    return newBoss.toObject();
  }

  async findBoss(getBossDto: GetBossDto) {
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
        .findOne({ bossName: getBossDto.bossName })
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

  async findAllBossesByUser(email: string, server: Servers) {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === server,
    ).model;
    const { excludedBosses, unavailableBosses } =
      await this.usersService.findUser(email);

    const undisplayedBosses = excludedBosses.concat(
      unavailableBosses.filter((item) => excludedBosses.indexOf(item) < 0),
    );

    const arrayOfObjectsUndisplayedBosses = undisplayedBosses.map((item) => ({
      bossName: item,
    }));
    arrayOfObjectsUndisplayedBosses.push({ bossName: 'Mocked Name of Boss' }); // coz $nor doesn't work with empty array

    return bossModel
      .find({ $nor: arrayOfObjectsUndisplayedBosses })
      .lean()
      .exec();
  }

  async updateBoss(
    server: Servers,
    bossName: BossTypes,
    updateBossDto: UpdateBossDto,
  ) {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === server,
    ).model;
    return bossModel
      .updateOne({ bossName: bossName }, { $set: updateBossDto }, { new: true })
      .lean()
      .exec();
  }

  async getNicknameFromToken(request: Request){
    interface DecodeResult {
      email: string;
      nickname: string;
      iat: number;
      exp: number;
    }

    const accessToken= request.headers.authorization?.split(' ')[1]
    const { nickname } = this.jwtService.decode(accessToken) as DecodeResult;
    return nickname
  }

  async updateDeathOfBoss(request: Request, getBossDto: GetBossDto) {
    const nickname = await this.getNicknameFromToken(request)

    const bossModel = this.bossModels.find(
      (obj) => obj.server === getBossDto.server,
    ).model;

    const boss = await this.findBoss(getBossDto);
    let nextResurrectTime = boss.cooldownTime;

    const history: History = {
      bossName: getBossDto.bossName,
      nickname: nickname,
      server: getBossDto.server,
      date: Date.now()
    }

    if (!getBossDto.date) {
      history.toWillResurrect = nextResurrectTime + Date.now()
      history.fromCooldown = boss.cooldown
      history.toCooldown = ++boss.cooldown
      await this.historyService.createHistory(history)

      return bossModel.updateOne(
        { bossName: boss.bossName },
        { $inc: { cooldown: 1, willResurrect: nextResurrectTime } },
      );
    }
    history.toWillResurrect = nextResurrectTime + getBossDto.date
    await this.historyService.createHistory(history)

    return bossModel.updateOne(
      { bossName: boss.bossName },
      { willResurrect: nextResurrectTime },
    );
  }

  async deleteBoss(server: Servers, bossName: BossTypes) {
    const bossModel = this.bossModels.find(
      (obj) => obj.server === server,
    ).model;
    return bossModel.deleteOne({ bossName: bossName });
  }

  // async crashBossServer(server: Servers) {
  //   try {
  //     const bossModel = this.bossModels.find(
  //       (obj) => obj.server === server,
  //     ).model;
  //
  //     const createHistoryBossDto = {
  //       bossName: BossTypes.Все,
  //       nickname: 'Mocked',
  //       server: server,
  //       crashServer: true,
  //       date: Date.now()
  //     }
  //
  //     await this.historyService.createHistoryForCrashServer()
  //
  //     return bossModel.updateMany(
  //       { willResurrect: { $gte: Date.now() } },
  //       { $inc: { willResurrect: -300000 } },
  //     ); // minus 5 minutes
  //   } catch (err) {
  //     throw new BadRequestException('Something went wrong!!!');
  //   }
  // }

  // async createHistoryItem(createHistoryBossDto: CreateHistoryBossDto){
  //   const historyModel = this.historyModels.find(
  //     (obj) => obj.server === createHistoryBossDto.server,
  //   ).model;
  //   return historyModel.create(createHistoryBossDto)
  // }
}
