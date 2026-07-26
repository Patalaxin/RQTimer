// Одноразовый скрипт переноса сессий телеграм-бота из Mongo в Postgres.
//
// В Postgres userId и email — уникальные колонки, чего в Mongo не было
// (уникальным был только userId). Дубликаты по почте склеиваются в одну
// строку: выигрывает самая «полная» — с userId и подтверждением.
//
// Как использовать:
//   MONGO_URI=mongodb://user:pass@localhost:27017/admin npx ts-node src/scripts/migrate-bot-sessions-to-postgres.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { PrismaClient, Server } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { BotSessionSchema } from '../schemas/telegram-bot.schema';

async function main() {
  const mongoUri =
    process.env.MONGO_URI ??
    `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.IP_DB}:27017/admin`;

  await mongoose.connect(mongoUri);
  const BotSessionModel = mongoose.model(
    'BotSession',
    BotSessionSchema,
    'botsessions',
  );

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const sessions = await BotSessionModel.find().lean();
  console.log(`Найдено в Mongo: ${sessions.length} сессий`);

  // Сначала схлопываем дубликаты по почте — в Postgres email уникален.
  const byEmail = new Map<string, (typeof sessions)[number]>();
  const withoutEmail: typeof sessions = [];
  let collapsed = 0;

  for (const session of sessions) {
    if (!session.email) {
      withoutEmail.push(session);
      continue;
    }

    const key = session.email.toLowerCase();
    const kept = byEmail.get(key);
    if (!kept) {
      byEmail.set(key, session);
      continue;
    }

    collapsed++;
    // Полнее та, у которой есть привязка к телеграму и подтверждение.
    const score = (s: (typeof sessions)[number]) =>
      (s.userId ? 2 : 0) + (s.isVerified ? 1 : 0);
    if (score(session) > score(kept)) {
      byEmail.set(key, session);
    }
  }

  if (collapsed) {
    console.warn(`Схлопнуто дубликатов по почте: ${collapsed}`);
  }

  let migrated = 0;
  let failed = 0;

  for (const session of [...byEmail.values(), ...withoutEmail]) {
    try {
      await prisma.botSession.create({
        data: {
          userId: session.userId ?? null,
          email: session.email ?? null,
          groupName: session.groupName ?? null,
          server: (session.server as unknown as Server) ?? null,
          paused: session.paused ?? false,
          isVerified: session.isVerified ?? false,
          timezone: session.timezone ?? null,
        },
      });
      migrated++;
    } catch (error) {
      failed++;
      console.error(
        `Пропущена сессия ${session.email ?? session.userId}:`,
        (error as Error).message,
      );
    }
  }

  console.log(`Перенесено сессий: ${migrated}, с ошибкой: ${failed}`);
  console.log(
    `Сверка после переноса: Postgres bot_sessions=${await prisma.botSession.count()}`,
  );

  await prisma.$disconnect();
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Ошибка миграции:', error);
  process.exit(1);
});
