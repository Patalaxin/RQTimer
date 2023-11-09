import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
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
import { CreateEliteDtoRequest } from './dto/create-elite.dto';
import {
  UpdateEliteDtoBodyRequest,
  UpdateEliteDtoParamsRequest,
} from './dto/update-elite.dto';
import { Request } from 'express';
import { History } from '../interfaces/history.interface';
import { HistoryService } from '../history/history.service';
import { JwtService } from '@nestjs/jwt';
import { HelperClass } from '../helper-class';
import { GetElitesDtoRequest } from './dto/get-elites.dto';
import { DeleteEliteDtoResponse } from './dto/delete-elite.dto';
import { UpdateEliteCooldownDtoRequest } from './dto/update-elite-cooldown.dto';
import { TelegramBotService } from '../telegramBot/bot.service';
import { UpdateEliteByCooldownDtoRequest } from './dto/update-elite-by-cooldown.dto';
import { UpdateEliteDateOfDeathDtoRequest } from './dto/update-elite-date-of-death.dto';
import { UpdateEliteDateOfRespawnDtoRequest } from './dto/update-elite-date-of-respawn.dto';

@Injectable()
export class ElitesService {
  private elitesModels: any;

  constructor(
    @InjectModel(GranasElite.name)
    private granasEliteModel: Model<GranasEliteDocument>,
    @InjectModel(EnigmaElite.name)
    private enigmaEliteModel: Model<EnigmaEliteDocument>,
    @InjectModel(LogrusElite.name)
    private logrusEliteModel: Model<LogrusEliteDocument>,
    private usersService: UsersService,
    private historyService: HistoryService,
    private botService: TelegramBotService,
    private jwtService: JwtService,
  ) {
    this.elitesModels = [
      { server: 'Гранас', model: this.granasEliteModel },
      { server: 'Логрус', model: this.logrusEliteModel },
      { server: 'Энигма', model: this.enigmaEliteModel },
    ];
  }

  async createElite(
    createEliteDto: CreateEliteDtoRequest,
  ): Promise<GetEliteDtoResponse> {
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

    const elite = await eliteModel
      .findOne({ eliteName: getEliteDto.eliteName }, { __v: 0 })
      .lean()
      .exec();
    if (!elite?._id) {
      throw new BadRequestException('Elite not found');
    }

    return elite;
  }

  async findAllEliteByUser(
    email: string,
    getElitesDtoRequest: GetElitesDtoRequest,
  ): Promise<GetEliteDtoResponse[]> {
    const eliteModel = this.elitesModels.find(
      (obj) => obj.server === getElitesDtoRequest.server,
    ).model;
    const { excludedElites, unavailableElites } =
      await this.usersService.findUser(email);

    const undisplayedElites: string[] = excludedElites.concat(
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
  ): Promise<GetEliteDtoResponse> {
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

  async updateEliteByCooldown(
    request: Request,
    updateEliteByCooldownDto: UpdateEliteByCooldownDtoRequest,
  ): Promise<GetEliteDtoResponse> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    const getEliteDto = {
      eliteName: updateEliteByCooldownDto.eliteName,
      server: updateEliteByCooldownDto.server,
    };

    const eliteModel = this.elitesModels.find(
      // Finding the elite database by server
      (obj) => obj.server === updateEliteByCooldownDto.server,
    ).model;

    const elite: GetEliteDtoResponse = await this.findElite(getEliteDto);
    const timeoutName: string = await HelperClass.generateUniqueName();

    if (elite.respawnTime === null) {
      throw new BadRequestException(
        'Respawn is lost, so it is not possible to update on a cooldown. Some date of death (dateOfDeath) or date of respawn (dateOfRespawn) must be specified',
      );
    }

    const history: History = {
      eliteName: updateEliteByCooldownDto.eliteName,
      nickname: nickname,
      server: updateEliteByCooldownDto.server,
      date: Date.now(),
    };

    let nextResurrectTime: number = elite.cooldownTime;
    history.toWillResurrect = nextResurrectTime;
    history.fromCooldown = elite.cooldown;
    history.toCooldown = ++elite.cooldown;
    await this.historyService.createHistory(history);
    const previousRespawnTime: number = elite.respawnTime;

    await this.botService.newTimeout(
      timeoutName,
      elite.respawnTime + nextResurrectTime,
      updateEliteByCooldownDto.eliteName,
      updateEliteByCooldownDto.server,
    );

    return eliteModel
      .findOneAndUpdate(
        // Add +1 to the cooldown counter and update the respawn/death times
        { eliteName: elite.eliteName },
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

  async updateEliteDateOfDeath(
    request: Request,
    updateEliteDateOfDeathDto: UpdateEliteDateOfDeathDtoRequest,
  ): Promise<GetEliteDtoResponse> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    const getEliteDto = {
      eliteName: updateEliteDateOfDeathDto.eliteName,
      server: updateEliteDateOfDeathDto.server,
    };

    const eliteModel = this.elitesModels.find(
      // Finding the elite database by server
      (obj) => obj.server === updateEliteDateOfDeathDto.server,
    ).model;

    const elite: GetEliteDtoResponse = await this.findElite(getEliteDto); // Get the elite we're updating
    const timeoutName: string = await HelperClass.generateUniqueName();

    const history: History = {
      eliteName: updateEliteDateOfDeathDto.eliteName,
      nickname: nickname,
      server: updateEliteDateOfDeathDto.server,
      date: Date.now(),
    };

    let nextResurrectTime: number =
      updateEliteDateOfDeathDto.dateOfDeath + elite.cooldownTime; // If the elite is dead now.
    history.toWillResurrect = nextResurrectTime;
    await this.historyService.createHistory(history);

    await this.botService.newTimeout(
      timeoutName,
      nextResurrectTime,
      updateEliteDateOfDeathDto.eliteName,
      updateEliteDateOfDeathDto.server,
    );

    return eliteModel
      .findOneAndUpdate(
        // Update the respawn at the exact time of death.
        { eliteName: elite.eliteName },
        {
          respawnTime: nextResurrectTime,
          cooldown: 0,
          deathTime: updateEliteDateOfDeathDto.dateOfDeath,
          respawnLost: false,
        },
        { new: true },
      )
      .select('-__v')
      .lean()
      .exec();
  }

  async updateEliteDateOfRespawn(
    request: Request,
    updateEliteDateOfRespawnDto: UpdateEliteDateOfRespawnDtoRequest,
  ): Promise<GetEliteDtoResponse> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    const getEliteDto = {
      eliteName: updateEliteDateOfRespawnDto.eliteName,
      server: updateEliteDateOfRespawnDto.server,
    };

    const eliteModel = this.elitesModels.find(
      // Finding the elite database by server
      (obj) => obj.server === updateEliteDateOfRespawnDto.server,
    ).model;

    const elite: GetEliteDtoResponse = await this.findElite(getEliteDto); // Get the elite we're updating
    const timeoutName: string = await HelperClass.generateUniqueName();

    const history: History = {
      eliteName: updateEliteDateOfRespawnDto.eliteName,
      nickname: nickname,
      server: updateEliteDateOfRespawnDto.server,
      date: Date.now(),
    };

    let nextResurrectTime: number = updateEliteDateOfRespawnDto.dateOfRespawn;
    history.toWillResurrect = nextResurrectTime;
    await this.historyService.createHistory(history);
    const deathTime: number = nextResurrectTime - elite.cooldownTime;
    const adjustedDeathTime: number = deathTime < 0 ? 0 : deathTime;

    await this.botService.newTimeout(
      timeoutName,
      updateEliteDateOfRespawnDto.dateOfRespawn,
      updateEliteDateOfRespawnDto.eliteName,
      updateEliteDateOfRespawnDto.server,
    );

    return eliteModel
      .findOneAndUpdate(
        // Update the respawn at the exact time of respawn.
        { eliteName: elite.eliteName },
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

  async updateCooldownCounterElite(
    updateEliteCooldownDtoRequest: UpdateEliteCooldownDtoRequest,
  ): Promise<GetEliteDtoResponse> {
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
  ): Promise<GetEliteDtoResponse[]> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );

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
  ): Promise<GetEliteDtoResponse[]> {
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
