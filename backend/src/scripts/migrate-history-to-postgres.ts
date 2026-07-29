// Одноразовый скрипт переноса истории из Mongo в Postgres.
//
// В Mongo под историю было две коллекции — heliosHistory и fenixHistory;
// здесь они схлопываются в одну таблицу с колонкой server.
//
// История живёт 3 дня, поэтому протухшие записи не переносятся: в Mongo их
// удалял TTL-индекс по expireAt, здесь expiresAt хранится явно.
//
// Как использовать:
//   MONGO_URI=mongodb://user:pass@localhost:27017/admin npx ts-node src/scripts/migrate-history-to-postgres.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { HistoryType, PrismaClient, Role, Server } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { HeliosHistorySchema } from '../schemas/heliosHistory.schema';
import { FenixHistorySchema } from '../schemas/fenixHistory.schema';

const HISTORY_TTL_MS = 3 * 24 * 60 * 60 * 1000;

async function main() {
  const mongoUri =
    process.env.MONGO_URI ??
    `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.IP_DB}:27017/admin`;

  await mongoose.connect(mongoUri);

  const collections = [
    {
      server: Server.Helios,
      model: mongoose.model(
        'HeliosHistory',
        HeliosHistorySchema,
        'helioshistories',
      ),
    },
    {
      server: Server.Fenix,
      model: mongoose.model(
        'FenixHistory',
        FenixHistorySchema,
        'fenixhistories',
      ),
    },
  ];

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  let migrated = 0;
  let expired = 0;
  let failed = 0;

  for (const { server, model } of collections) {
    const rows = await model.find().lean();
    console.log(`Найдено в Mongo (${server}): ${rows.length} записей`);

    for (const row of rows) {
      // expireAt в Mongo — момент создания, TTL-индекс докидывал 3 дня сверху.
      const createdAt = row.expireAt ?? new Date(row.date);
      const expiresAt = new Date(createdAt.getTime() + HISTORY_TTL_MS);

      if (expiresAt < new Date()) {
        expired++;
        continue;
      }

      try {
        await prisma.history.create({
          data: {
            id: String(row._id),
            mobId: row.mobId ?? null,
            mobName: row.mobName,
            location: row.location ?? null,
            nickname: row.nickname,
            role: row.role as unknown as Role,
            // Сервер берём из имени коллекции: в самих документах поле
            // проставлено не везде.
            server,
            groupName: row.groupName ?? null,
            historyTypes: row.historyTypes as unknown as HistoryType,
            date: row.date,
            toWillResurrect: row.toWillResurrect ?? null,
            fromCooldown: row.fromCooldown ?? null,
            toCooldown: row.toCooldown ?? null,
            crashServer: row.crashServer ?? false,
            expiresAt,
          },
        });
        migrated++;
      } catch (error) {
        failed++;
        console.error(
          `Пропущена запись ${row._id} (${server}):`,
          (error as Error).message,
        );
      }
    }
  }

  console.log(
    `Перенесено: ${migrated}, протухших пропущено: ${expired}, с ошибкой: ${failed}`,
  );

  const [helios, fenix] = await Promise.all([
    prisma.history.count({ where: { server: Server.Helios } }),
    prisma.history.count({ where: { server: Server.Fenix } }),
  ]);
  console.log(
    `Сверка после переноса: Postgres history Helios=${helios}, Fenix=${fenix}`,
  );

  await prisma.$disconnect();
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Ошибка миграции:', error);
  process.exit(1);
});
