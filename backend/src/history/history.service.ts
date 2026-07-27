import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  History as PrismaHistory,
  HistoryType,
  Prisma,
  Role,
  Server,
} from '@prisma/client';
import { NotFoundError } from '../errors/app.error';
import { Locations, MobName, Servers } from '../schemas/mobs.enum';
import { RolesTypes } from '../schemas/roles.enum';
import { PaginatedHistoryDto } from './dto/get-history.dto';
import { DeleteAllHistoryDtoResponse } from './dto/delete-history.dto';
import { IHistory } from './history.interface';
import { History, HistoryTypes } from './history-types.interface';
import { translateMob } from '../utils/translate-mob';
import { PrismaService } from '../prisma/prisma.service';
import { CleanupRegistryService } from '../cleanup/cleanup-registry.service';

const HISTORY_TTL_MS = 3 * 24 * 60 * 60 * 1000;

@Injectable()
export class HistoryService implements IHistory, OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cleanupRegistry: CleanupRegistryService,
  ) {}

  onModuleInit(): void {
    this.cleanupRegistry.register('history', async () => {
      const { count } = await this.prisma.history.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return count;
    });
  }

  private toHistory(row: PrismaHistory): History {
    return {
      mobId: row.mobId ?? undefined,
      mobName: row.mobName as MobName,
      nickname: row.nickname,
      server: row.server as unknown as Servers,
      groupName: row.groupName ?? undefined,
      location: (row.location as Locations) ?? undefined,
      date: row.date,
      role: row.role as unknown as RolesTypes,
      historyTypes: row.historyTypes as unknown as HistoryTypes,
      toWillResurrect: row.toWillResurrect ?? undefined,
      fromCooldown: row.fromCooldown ?? undefined,
      toCooldown: row.toCooldown ?? undefined,
      crashServer: row.crashServer,
    };
  }

  async createHistory(history: History): Promise<History> {
    const row = await this.prisma.history.create({
      data: {
        mobId: history.mobId ?? null,
        mobName: history.mobName,
        location: history.location ?? null,
        nickname: history.nickname,
        role: history.role as unknown as Role,
        server: history.server as unknown as Server,
        groupName: history.groupName ?? null,
        historyTypes: history.historyTypes as unknown as HistoryType,
        date: history.date,
        toWillResurrect: history.toWillResurrect ?? null,
        fromCooldown: history.fromCooldown ?? null,
        toCooldown: history.toCooldown ?? null,
        crashServer: history.crashServer ?? false,
        expiresAt: new Date(Date.now() + HISTORY_TTL_MS),
      },
    });

    return this.toHistory(row);
  }

  /**
   * Подменяет название моба и локацию на переведённые. Записи журнала хранят
   * русские значения на момент действия, перевод накладывается на выдаче.
   */
  private async translateRows(
    rows: PrismaHistory[],
    lang?: string,
  ): Promise<PaginatedHistoryDto['data']> {
    const mobIds = [...new Set(rows.map((row) => row.mobId).filter(Boolean))];

    const mobs = mobIds.length
      ? await this.prisma.mob.findMany({ where: { id: { in: mobIds } } })
      : [];

    const translatedByMobId = new Map(
      mobs.map((mob) => {
        const translated = translateMob({ ...mob, _id: mob.id }, lang);
        return [
          mob.id,
          { mobName: translated.mobName, location: translated.location },
        ];
      }),
    );

    return rows.map((row) => {
      const translated = translatedByMobId.get(row.mobId);
      return {
        ...this.toHistory(row),
        mobName: (translated?.mobName ?? row.mobName) as MobName,
        location: (translated?.location ?? row.location) as Locations,
      };
    });
  }

  private async paginate(
    where: Prisma.HistoryWhereInput,
    page: number,
    limit: number,
    lang?: string,
  ): Promise<PaginatedHistoryDto> {
    const [total, rows] = await Promise.all([
      this.prisma.history.count({ where }),
      this.prisma.history.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: await this.translateRows(rows, lang),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getAllHistory(
    server: Servers,
    groupName: string,
    page: number = 1,
    limit: number = 10,
    lang?: string,
    historyType?: HistoryTypes,
  ): Promise<PaginatedHistoryDto> {
    if (!groupName) {
      throw new NotFoundError('HISTORY_NOT_FOUND', 'History not found');
    }

    return this.paginate(
      {
        server: server as unknown as Server,
        groupName,
        ...(historyType
          ? { historyTypes: historyType as unknown as HistoryType }
          : {}),
      },
      page,
      limit,
      lang,
    );
  }

  async getMobHistory(
    server: Servers,
    groupName: string,
    mobId: string,
    page: number = 1,
    limit: number = 10,
    lang?: string,
  ): Promise<PaginatedHistoryDto> {
    if (!groupName || !mobId) {
      throw new NotFoundError('HISTORY_NOT_FOUND', 'History not found');
    }

    return this.paginate(
      { server: server as unknown as Server, groupName, mobId },
      page,
      limit,
      lang,
    );
  }

  async deleteAll(
    server: Servers,
    groupName: string,
  ): Promise<DeleteAllHistoryDtoResponse> {
    await this.prisma.history.deleteMany({
      where: { server: server as unknown as Server, groupName },
    });

    return { message: 'All history deleted', status: 200 };
  }
}
