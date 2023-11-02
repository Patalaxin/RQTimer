import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { Token, TokenDocument } from '../schemas/refreshToken.schema';
import { EliteTypes, Servers } from '../schemas/mobs.enum';
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
import { GetEliteDtoRequest, GetEliteDtoResponse } from './dto/get-elite.dto';
import {
  CreateEliteDtoRequest,
  CreateEliteDtoResponse,
} from './dto/create-elite.dto';
import {
  UpdateEliteDtoBodyRequest,
  UpdateEliteDtoBodyResponse,
  UpdateEliteDtoParamsRequest,
} from './dto/update-elite.dto';
import { Request } from 'express';
import { History } from '../interfaces/history.interface';
import { HistoryService } from '../history/history.service';
import { JwtService } from '@nestjs/jwt';
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
import {
  UpdateEliteDeathDtoRequest,
  UpdateEliteDeathDtoResponse,
} from './dto/update-elite-death.dto';
import { HelperClass } from '../helper-class';
import {
  GetElitesDtoRequest,
  GetElitesDtoResponse,
} from './dto/get-elites.dto';
import { DeleteEliteDtoResponse } from './dto/delete-elite.dto';
import {
  UpdateEliteCooldownDtoRequest,
  UpdateEliteCooldownDtoResponse,
} from './dto/update-elite-cooldown.dto';
import { RespawnLostEliteDtoResponse } from './dto/respawnLost-elite.dto';

@Injectable()
export class ElitesService {
  private elitesModels: any;
  private historyModels: any;

  public getNicknameFromToken(request: Request): any {
    return HelperClass.getNicknameFromToken(request, this.jwtService);
  }
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

  async createElite(
    createEliteDto: CreateEliteDtoRequest,
  ): Promise<CreateEliteDtoResponse> {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === createEliteDto.server,
    ).model;

    try {
      const newElite = await eliteModel.create(createEliteDto);
      await newElite.save();
      return newElite.toObject();
    } catch (err) {
      throw new BadRequestException(
        'Something went wrong. Probably this elite already exist in this location',
      );
    }
  }

  async findElite(
    getEliteDto: GetEliteDtoRequest,
  ): Promise<GetEliteDtoResponse> {
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
        .findOne({ eliteName: getEliteDto.eliteName }, { __v: 0 })
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

  async findAllEliteByUser(
    email: string,
    getElitesDtoRequest: GetElitesDtoRequest,
  ): Promise<GetElitesDtoResponse[]> {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === getElitesDtoRequest.server,
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
    updateEliteDtoParamsRequest: UpdateEliteDtoParamsRequest,
    updateEliteDto: UpdateEliteDtoBodyRequest,
  ): Promise<UpdateEliteDtoBodyResponse> {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === updateEliteDtoParamsRequest.server,
    ).model;
    return eliteModel
      .findOneAndUpdate(
        { eliteName: updateEliteDtoParamsRequest.eliteName },
        { $set: updateEliteDto },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }

  async updateDeathOfElite(
    request: Request,
    updateEliteDeathDto: UpdateEliteDeathDtoRequest,
  ): Promise<UpdateEliteDeathDtoResponse> {
    if (updateEliteDeathDto.dateOfDeath && updateEliteDeathDto.dateOfRespawn) {
      throw new BadRequestException(
        'dateOfDeath and dateOfRespawn should not be together',
      );
    }

    const nickname = await this.getNicknameFromToken(request);
    const getEliteDto = {
      eliteName: updateEliteDeathDto.eliteName,
      server: updateEliteDeathDto.server,
    };

    const eliteModel = this.elitesModels.find(
      // Finding the elite database by server
      (obj) => obj.server === updateEliteDeathDto.server,
    ).model;

    const elite: GetEliteDtoResponse = await this.findElite(getEliteDto); // Get the elite we're updating

    if (
      isNaN(updateEliteDeathDto.dateOfDeath) &&
      isNaN(updateEliteDeathDto.dateOfRespawn) &&
      elite.respawnTime === null
    ) {
      throw new BadRequestException(
        'Respawn is lost, so it is not possible to update on a cooldown. Some date of death (dateOfDeath) or date of respawn (dateOfRespawn) must be specified',
      );
    }

    const history: History = {
      eliteName: updateEliteDeathDto.eliteName,
      nickname: nickname,
      server: updateEliteDeathDto.server,
      date: Date.now(),
    };

    if (
      isNaN(updateEliteDeathDto.dateOfDeath) &&
      isNaN(updateEliteDeathDto.dateOfRespawn)
    ) {
      // If the elite died at a certain time not now.
      let nextResurrectTime = elite.cooldownTime;
      history.toWillResurrect = nextResurrectTime;
      history.fromCooldown = elite.cooldown;
      history.toCooldown = ++elite.cooldown;
      await this.historyService.createHistory(history);
      const deathTime = elite.respawnTime;

      return eliteModel
        .findOneAndUpdate(
          // Add +1 to the cooldown counter and update the respawn on cd
          { eliteName: elite.eliteName },
          {
            $inc: { cooldown: 1, respawnTime: nextResurrectTime },
            deathTime: deathTime,
          },
          { new: true },
        )
        .select('-__v')
        .lean()
        .exec();
    }

    if (updateEliteDeathDto.dateOfRespawn >= 0) {
      // If we now know the exact time of the elite respawn.
      let nextResurrectTime = updateEliteDeathDto.dateOfRespawn;
      history.toWillResurrect = nextResurrectTime;
      await this.historyService.createHistory(history);
      const deathTime = nextResurrectTime - elite.cooldownTime;
      const adjustedDeathTime = deathTime < 0 ? 0 : deathTime;

      return eliteModel
        .findOneAndUpdate(
          // Update the respawn at the exact time of respawn.
          { eliteName: elite.eliteName },
          {
            respawnTime: nextResurrectTime,
            cooldown: 0,
            deathTime: adjustedDeathTime,
          },
          { new: true },
        )
        .select('-__v')
        .lean()
        .exec();
    }

    let nextResurrectTime =
      updateEliteDeathDto.dateOfDeath + elite.cooldownTime; // If the elite is dead now.
    history.toWillResurrect = nextResurrectTime;
    await this.historyService.createHistory(history);

    return eliteModel
      .findOneAndUpdate(
        // Update the respawn at the exact time of death.
        { eliteName: elite.eliteName },
        {
          respawnTime: nextResurrectTime,
          cooldown: 0,
          deathTime: updateEliteDeathDto.dateOfDeath,
        },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }

  async updateCooldownCounterElite(
    updateEliteCooldownDtoRequest: UpdateEliteCooldownDtoRequest,
  ): Promise<UpdateEliteCooldownDtoResponse> {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === updateEliteCooldownDtoRequest.server,
    ).model;

    try {
      return await eliteModel
        .findOneAndUpdate(
          { eliteName: updateEliteCooldownDtoRequest.eliteName },
          { cooldown: updateEliteCooldownDtoRequest.cooldown },
          { new: true },
        )
        .select('-__v')
        .lean()
        .exec();
    } catch (err) {
      throw new BadRequestException('Something went wrong!');
    }
  }

  async crashEliteServer(
    request: Request,
    server: Servers,
  ): Promise<GetElitesDtoResponse[]> {
    const nickname = this.getNicknameFromToken(request);

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

      history.crashServer = true;
      await this.historyService.createHistory(history);

      await eliteModel.updateMany(
        { respawnTime: { $gte: Date.now() } },
        { $inc: { respawnTime: -18000 } },
      ); // // minus 18 seconds for elites

      return await eliteModel.find({}).select('-__v').lean().exec();
    } catch (err) {
      throw new BadRequestException('Something went wrong!!!');
    }
  }

  async deleteElite(
    server: Servers,
    eliteName: EliteTypes,
  ): Promise<DeleteEliteDtoResponse> {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === server,
    ).model;
    await eliteModel.deleteOne({ eliteName: eliteName });
    return { message: 'Elite deleted' };
  }

  async respawnLost(
    server: Servers,
    eliteName: EliteTypes,
  ): Promise<RespawnLostEliteDtoResponse[]> {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === server,
    ).model;

    return await eliteModel
      .findOneAndUpdate(
        { eliteName: eliteName },
        { cooldown: 0, respawnTime: null, deathTime: null, respawnLost: true },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }
}