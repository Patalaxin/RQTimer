// Одноразовый скрипт переноса MobsData (состояние мобов по группам) из Mongo
// в Postgres.
//
// Запускать ПОСЛЕ migrate-mobs-to-postgres.ts: mobs_data.mobId — внешний ключ
// на справочник. Строки, ссылающиеся на исчезнувшего моба, пропускаются с
// отчётом — в Mongo такие висели незамеченными.
//
// Как использовать:
//   MONGO_URI=mongodb://user:pass@localhost:27017/admin npx ts-node src/scripts/migrate-mobs-data-to-postgres.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { PrismaClient, Server } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { MobsDataSchema } from '../schemas/mobsData.schema';

async function main() {
  const mongoUri =
    process.env.MONGO_URI ??
    `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.IP_DB}:27017/admin`;

  await mongoose.connect(mongoUri);
  const MobsDataModel = mongoose.model(
    'MobsData',
    MobsDataSchema,
    'mobsdatas',
  );

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const knownMobIds = new Set(
    (await prisma.mob.findMany({ select: { id: true } })).map((mob) => mob.id),
  );
  if (knownMobIds.size === 0) {
    throw new Error(
      'В Postgres нет ни одного моба — сначала прогоните migrate-mobs-to-postgres.ts',
    );
  }

  const mongoMobsData = await MobsDataModel.find().lean();
  console.log(`Найдено в Mongo: ${mongoMobsData.length} записей mobsData`);

  let migrated = 0;
  let orphaned = 0;
  let failed = 0;

  for (const row of mongoMobsData) {
    const mobId = String(row.mobId);

    if (!knownMobIds.has(mobId)) {
      orphaned++;
      console.warn(
        `Пропущено: моба ${mobId} нет в справочнике (группа ${row.groupName}, сервер ${row.server})`,
      );
      continue;
    }

    try {
      await prisma.mobsData.create({
        data: {
          mobId,
          groupName: row.groupName,
          server: row.server as unknown as Server,
          respawnTime: row.respawnTime ?? null,
          deathTime: row.deathTime ?? null,
          cooldown: row.cooldown ?? 0,
          comment: row.comment ?? null,
          respawnLost: row.respawnLost ?? false,
          mobTypeAdditionalTime: row.mobTypeAdditionalTime,
        },
      });
      migrated++;
    } catch (error) {
      failed++;
      console.error(
        `Ошибка на записи ${mobId} / ${row.groupName} / ${row.server}:`,
        (error as Error).message,
      );
    }
  }

  console.log(
    `Перенесено: ${migrated}, без моба в справочнике: ${orphaned}, с ошибкой: ${failed}`,
  );
  console.log(
    `Сверка после переноса: Postgres mobs_data=${await prisma.mobsData.count()}`,
  );

  await prisma.$disconnect();
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Ошибка миграции:', error);
  process.exit(1);
});
