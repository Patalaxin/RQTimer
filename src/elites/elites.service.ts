import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { Token, TokenDocument } from '../schemas/refreshToken.schema';
import { EliteTypes, Servers } from "../schemas/bosses.enum";
import {
  EnigmaElite,
  EnigmaEliteDocument,
} from '../schemas/enigmaElites.schema';
import {
  LogrusElite,
  LogrusEliteDocument,
} from '../schemas/logrusElites.schema';
import {
  GranasElite,
  GranasEliteDocument,
} from '../schemas/granasElites.schema';
import { GetEliteDto } from './dto/get-elite.dto';
import { CreateEliteDto } from './dto/create-elite.dto';
import { UpdateEliteDto } from './dto/update-elite.dto';
import { Request } from "express";
import { History } from "../interfaces/history.interface";
import { HistoryService } from "../history/history.service";
import { JwtService } from "@nestjs/jwt";
import { GranasHistory, GranasHistoryDocument } from "../schemas/granasHistory.schema";
import { EnigmaHistory, EnigmaHistoryDocument } from "../schemas/enigmaHistory.schema";
import { LogrusHistory, LogrusHistoryDocument } from "../schemas/logrusHistory.schema";
import { UpdateEliteDeathDto } from "./dto/update-elite-death.dto";

@Injectable()
export class ElitesService {
  private elitesModels: any;
  private historyModels: any;
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(GranasElite.name)
    private granasEliteModel: Model<GranasEliteDocument>,
    @InjectModel(EnigmaElite.name)
    private enigmaEliteModel: Model<EnigmaEliteDocument>,
    @InjectModel(LogrusElite.name)
    private logrusEliteModel: Model<LogrusEliteDocument>,
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
    this.elitesModels = [
      { server: 'Гранас', model: this.granasEliteModel },
      { server: 'Логрус', model: this.logrusEliteModel },
      { server: 'Энигма', model: this.enigmaEliteModel },
    ];

    this.historyModels = [
      { server: 'Гранас', model: this.granasHistoryModel },
      { server: 'Логрус', model: this.enigmaHistoryModel },
      { server: 'Энигма', model: this.logrusHistoryModel },
    ];
  }

  async getNicknameFromToken(request: Request) {
    interface DecodeResult {
      email: string;
      nickname: string;
      iat: number;
      exp: number;
    }

    const accessToken = request.headers.authorization?.split(' ')[1];
    const { nickname } = this.jwtService.decode(accessToken) as DecodeResult;
    return nickname;
  }

  async createElite(createEliteDto: CreateEliteDto) {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === createEliteDto.server,
    ).model;

    const newElite = await eliteModel.create(createEliteDto);
    await newElite.save();
    return newElite.toObject();
  }

  async findElite(getEliteDto: GetEliteDto) {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === getEliteDto.server,
    ).model;

    if (!Object.values(Servers).includes(getEliteDto.server)) {
      throw new BadRequestException('Not valid server');
    }

    if (!Object.values(EliteTypes).includes(getEliteDto.eliteName)) {
      throw new BadRequestException('Not valid elite name');
    }

    try {
      const elite = await eliteModel
        .findOne({ eliteName: getEliteDto.eliteName })
        .lean()
        .exec();
      if (!elite?._id) {
        throw new BadRequestException();
      }

      return elite;
    } catch (error) {
      throw new BadRequestException('Elite not found');
    }
  }

  async findAllEliteByUser(email: string, server: Servers) {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === server,
    ).model;
    const { excludedElites, unavailableElites } =
      await this.usersService.findUser(email);

    const undisplayedElites = excludedElites.concat(
      unavailableElites.filter((item) => excludedElites.indexOf(item) === -1),
    );

    const arrayOfObjectsUndisplayedElites = undisplayedElites.map((item) => ({
      eliteName: item,
    }));
    arrayOfObjectsUndisplayedElites.push({ eliteName: 'Mocked Name of Elite' }); // coz $nor doesn't work with empty array

    return eliteModel
      .find({ $nor: arrayOfObjectsUndisplayedElites })
      .lean()
      .exec();
  }

  async updateElite(
    server: Servers,
    eliteName: EliteTypes,
    updateEliteDto: UpdateEliteDto,
  ) {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === server,
    ).model;
    return eliteModel
      .updateOne(
        { eliteName: eliteName },
        { $set: updateEliteDto },
        { new: true },
      )
      .lean()
      .exec();
  }

  async updateByCooldownElite(getEliteDto: GetEliteDto) {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === getEliteDto.server,
    ).model;

    const { cooldownTime, eliteName } = await this.findElite(getEliteDto);

    return eliteModel.updateOne(
      { eliteName: eliteName },
      { $inc: { cooldown: 1, willResurrect: cooldownTime } },
    );
  }

  async updateDeathOfElite(request: Request, updateEliteDeathDto: UpdateEliteDeathDto) {
    const nickname = await this.getNicknameFromToken(request);
    const getEliteDto = {
      eliteName: updateEliteDeathDto.eliteName,
      server: updateEliteDeathDto.server,
    };

    const eliteModel = this.elitesModels.find(
      // Finding the elite database by server
      (obj) => obj.server === updateEliteDeathDto.server,
    ).model;

    const elite = await this.findElite(getEliteDto); // Get the elite we're updating

    const history: History = {
      eliteName: updateEliteDeathDto.eliteName,
      nickname: nickname,
      server: updateEliteDeathDto.server,
      date: Date.now(),
    };

    if (!updateEliteDeathDto.dateOfDeath && !updateEliteDeathDto.dateOfRespawn) {
      // If the elite died at a certain time not now.
      let nextResurrectTime = elite.cooldownTime;
      history.toWillResurrect = nextResurrectTime;
      history.fromCooldown = elite.cooldown;
      history.toCooldown = ++elite.cooldown;
      await this.historyService.createHistory(history);

      return eliteModel.updateOne(
        // Add +1 to the cooldown counter and update the respawn on cd
        { eliteName: elite.eliteName },
        { $inc: { cooldown: 1, willResurrect: nextResurrectTime } },
      );
    }

    if (updateEliteDeathDto.dateOfRespawn) {
      // If we now know the exact time of the elite respawn.
      let nextResurrectTime = updateEliteDeathDto.dateOfRespawn;
      history.toWillResurrect = nextResurrectTime;
      await this.historyService.createHistory(history);

      return eliteModel.updateOne(
        // Update the respawn at the exact time of respawn.
        { eliteName: elite.eliteName },
        { willResurrect: nextResurrectTime },
      );
    }

    let nextResurrectTime = updateEliteDeathDto.dateOfDeath + elite.cooldownTime; // If the elite is dead now.
    history.toWillResurrect = nextResurrectTime;
    await this.historyService.createHistory(history);

    return eliteModel.updateOne(
      // Update the respawn at the exact time of death.
      { eliteName: elite.eliteName },
      { willResurrect: nextResurrectTime },
    );
  }

  async deleteElite(server: Servers, eliteName: EliteTypes) {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === server,
    ).model;
    return eliteModel.deleteOne({ eliteName: eliteName });
  }

  async crashEliteServer(request: Request, server: Servers) {
    const nickname = await this.getNicknameFromToken(request);

    try {
      const eliteModel = this.elitesModels.find(
        (obj) => obj.server === server,
      ).model;

      const history: History = {
        eliteName: EliteTypes.Все,
        nickname: nickname,
        server: server,
        date: Date.now(),
      };

      history.crashServer = true
      await this.historyService.createHistory(history);

      return eliteModel.updateMany(
        { willResurrect: { $gte: Date.now() } },
        { $inc: { willResurrect: -18000 } },
      ); // // minus 18 seconds for elites
    } catch (err) {
      throw new BadRequestException('Something went wrong!!!');
    }
  }
}
