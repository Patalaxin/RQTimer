import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { MobName, Servers } from '../schemas/mobs.enum';
import {
  GetHistoryDtoResponse,
  PaginatedHistoryDto,
} from './dto/get-history.dto';
import { DeleteAllHistoryDtoResponse } from './dto/delete-history.dto';

@Injectable()
export class HistoryService {
  private historyModels: any;

  constructor(
    @InjectModel(GranasHistory.name)
    private granasHistoryModel: Model<GranasHistoryDocument>,
    @InjectModel(EnigmaHistory.name)
    private enigmaHistoryModel: Model<EnigmaHistoryDocument>,
    @InjectModel(LogrusHistory.name)
    private logrusHistoryModel: Model<LogrusHistoryDocument>,
  ) {
    this.historyModels = [
      { server: 'Гранас', model: this.granasHistoryModel },
      { server: 'Энигма', model: this.enigmaHistoryModel },
      { server: 'Логрус', model: this.logrusHistoryModel },
    ];
  }

  async createHistory(history: History) {
    const historyModel = this.historyModels.find(
      (obj) => obj.server === history.server,
    ).model;

    return historyModel.create(history);
  }

  async getAllHistory(
    server: Servers,
    mobName?: MobName,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedHistoryDto> {
    try {
      const historyModel = this.historyModels.find(
        (obj) => obj.server === server,
      ).model;

      const query: any = {};
      if (mobName) {
        query.mobName = mobName;
      }

      const total = await historyModel.countDocuments(query).exec();
      const pages: number = Math.ceil(total / limit);
      const data = await historyModel
        .find(query, { __v: 0 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      return {
        data,
        total,
        page,
        pages,
      };
    } catch (err) {
      throw new BadRequestException('Something went wrong');
    }
  }

  async deleteAll(server: Servers): Promise<DeleteAllHistoryDtoResponse> {
    try {
      const historyModel = this.historyModels.find(
        (obj) => obj.server === server,
      ).model;
      await historyModel.deleteMany();
    } catch (err) {
      throw new BadRequestException('Something went wrong ');
    }
    return { message: 'All history deleted', status: 200 };
  }
}
