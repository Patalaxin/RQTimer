import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HeliosHistory,
  HeliosHistoryDocument,
} from '../schemas/heliosHistory.schema';
import { MobName, Servers } from '../schemas/mobs.enum';
import { PaginatedHistoryDto } from './dto/get-history.dto';
import { DeleteAllHistoryDtoResponse } from './dto/delete-history.dto';
import { IHistory } from './history.interface';
import { History } from './history-types.interface';

@Injectable()
export class HistoryService implements IHistory {
  private historyModels: any;

  constructor(
    @InjectModel(HeliosHistory.name)
    private heliosHistoryModel: Model<HeliosHistoryDocument>,
  ) {
    this.historyModels = [{ server: 'Гелиос', model: this.heliosHistoryModel }];
  }

  async createHistory(history: History): Promise<History> {
    const historyModel = this.historyModels.find(
      (obj) => obj.server === history.server,
    ).model;

    return historyModel.create(history);
  }

  async getAllHistory(
    server: Servers,
    groupName: string,
    page: number = 1,
    limit: number = 10,
    mobName?: MobName,
  ): Promise<PaginatedHistoryDto> {
    try {
      if (!groupName) {
        throw new NotFoundException('History not found');
      }

      const historyModel = this.historyModels.find(
        (obj) => obj.server === server,
      ).model;

      const query: any = { groupName: groupName };
      if (mobName) {
        query.mobName = mobName;
      }
      const total = await historyModel.countDocuments(query).exec();
      const pages: number = Math.ceil(total / limit);
      const data = await historyModel
        .find(query, { __v: 0 })
        .sort({ date: -1 })
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
      throw new NotFoundException('History not found!');
    }
  }

  async deleteAll(
    server: Servers,
    groupName: string,
  ): Promise<DeleteAllHistoryDtoResponse> {
    try {
      const historyModel = this.historyModels.find(
        (obj) => obj.server === server,
      ).model;
      await historyModel.deleteMany({
        groupName: groupName,
      });
    } catch (err) {
      throw new BadRequestException('Something went wrong ');
    }
    return { message: 'All history deleted', status: 200 };
  }
}
