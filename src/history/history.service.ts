import { Injectable } from '@nestjs/common';
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
import { History } from "../interfaces/history.interface";

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
      { server: 'Логрус', model: this.enigmaHistoryModel },
      { server: 'Энигма', model: this.logrusHistoryModel },
    ];
  }

  async createHistory(history: History) {
    const historyModel = this.historyModels.find(
      (obj) => obj.server === history.server,
    ).model;

    return historyModel.create(history);
  }
}
