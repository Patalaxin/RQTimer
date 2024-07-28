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
import { Servers } from '../schemas/mobs.enum';
import { GetHistoryDtoResponse } from './dto/get-history.dto';
import { DeleteAllHistoryDtoResponse } from './dto/delete-history.dto';
import { DeleteAllUsersDtoResponse } from '../users/dto/delete-user.dto';

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

  async getAllHistory(server: Servers): Promise<GetHistoryDtoResponse[]> {
    try {
      const historyModel = this.historyModels.find(
        (obj) => obj.server === server,
      ).model;

      return historyModel.find({}, { __v: 0 }).lean().exec();
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
