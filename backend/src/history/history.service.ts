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
import { Servers } from '../schemas/mobs.enum';
import { PaginatedHistoryDto } from './dto/get-history.dto';
import { DeleteAllHistoryDtoResponse } from './dto/delete-history.dto';
import { IHistory } from './history.interface';
import { History } from './history-types.interface';
import {
  IgnisHistory,
  IgnisHistoryDocument,
} from '../schemas/ignisHistory.schema';
import {
  AstusHistory,
  AstusHistoryDocument,
} from '../schemas/astusHistory.schema';
import {
  PyrosHistory,
  PyrosHistoryDocument,
} from '../schemas/pyrosHistory.schema';
import {
  AztecHistory,
  AztecHistoryDocument,
} from '../schemas/aztecHistory.schema';
import {
  OrtosHistory,
  OrtosHistoryDocument,
} from '../schemas/ortosHistory.schema';
import { Mob, MobDocument } from '../schemas/mob.schema';
import { translateMob } from '../utils/translate-mob';

@Injectable()
export class HistoryService implements IHistory {
  private readonly historyModels: any;

  constructor(
    @InjectModel(HeliosHistory.name)
    private readonly heliosHistoryModel: Model<HeliosHistoryDocument>,
    @InjectModel(IgnisHistory.name)
    private readonly ignisHistoryModel: Model<IgnisHistoryDocument>,
    @InjectModel(AstusHistory.name)
    private readonly astusHistoryModel: Model<AstusHistoryDocument>,
    @InjectModel(PyrosHistory.name)
    private readonly pyrosHistoryModel: Model<PyrosHistoryDocument>,
    @InjectModel(AztecHistory.name)
    private readonly aztecHistoryModel: Model<AztecHistoryDocument>,
    @InjectModel(OrtosHistory.name)
    private readonly ortosHistoryModel: Model<OrtosHistoryDocument>,
    @InjectModel(Mob.name)
    private readonly mobModel: Model<MobDocument>, // добавляем модель мобов
  ) {
    this.historyModels = [
      { server: 'Гелиос', model: this.heliosHistoryModel },
      { server: 'Игнис', model: this.ignisHistoryModel },
      { server: 'Astus', model: this.astusHistoryModel },
      { server: 'Pyros', model: this.pyrosHistoryModel },
      { server: 'Aztec', model: this.aztecHistoryModel },
      { server: 'Ortos', model: this.ortosHistoryModel },
    ];
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
    lang?: string,
  ): Promise<PaginatedHistoryDto> {
    try {
      if (!groupName) {
        throw new NotFoundException('History not found');
      }

      const historyModel = this.historyModels.find(
        (obj) => obj.server === server,
      ).model;

      const query: any = { groupName };

      const total = await historyModel.countDocuments(query).exec();
      const pages = Math.ceil(total / limit);

      const data = await historyModel
        .find(query, { __v: 0 })
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      const uniqueMobIds = [...new Set(data.map((item) => item.mobId))];

      const mobs = await this.mobModel
        .find({ _id: { $in: uniqueMobIds } })
        .lean()
        .exec();

      const mobsMap = mobs.reduce((acc, mob) => {
        const translated = translateMob(mob, lang);
        acc[mob._id.toString()] = {
          mobName: translated.mobName,
          location: translated.location,
        };
        return acc;
      }, {});

      const dataWithTranslatedFields = data.map((item) => {
        const translated = mobsMap[item.mobId] || {};
        return {
          ...item,
          mobName: translated.mobName ?? item.mobName,
          location: translated.location ?? item.location,
        };
      });

      return {
        data: dataWithTranslatedFields,
        total,
        page,
        pages,
      };
    } catch (err) {
      throw new NotFoundException('History not found!');
    }
  }

  async getMobHistory(
    server: Servers,
    groupName: string,
    mobId: string,
    page: number = 1,
    limit: number = 10,
    lang?: string,
  ): Promise<PaginatedHistoryDto> {
    try {
      if (!groupName || !mobId) {
        throw new NotFoundException('History not found');
      }

      const historyModel = this.historyModels.find(
        (obj) => obj.server === server,
      ).model;

      const query: any = { groupName, mobId };

      const total = await historyModel.countDocuments(query).exec();
      const pages = Math.ceil(total / limit);

      const data = await historyModel
        .find(query, { __v: 0 })
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      const mob = await this.mobModel.findOne({ _id: mobId }).lean().exec();

      const translated = mob ? translateMob(mob, lang) : {};

      const dataWithTranslatedFields = data.map((item) => ({
        ...item,
        mobName: translated.mobName ?? item.mobName,
        location: translated.location ?? item.location,
      }));

      return {
        data: dataWithTranslatedFields,
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
