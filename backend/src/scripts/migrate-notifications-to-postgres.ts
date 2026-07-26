// Одноразовый скрипт переноса NotificationSession из Mongo в Postgres.
//
// Уведомления живут 7 дней, поэтому переносятся только непротухшие: у Mongo-версии
// TTL считался от expireAt (= момент создания + 7 дней в индексе), в Postgres
// expiresAt хранится явно.
//
// Как использовать:
//   MONGO_URI=mongodb://user:pass@localhost:27017/admin npx ts-node src/scripts/migrate-notifications-to-postgres.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { NotificationSessionSchema } from '../schemas/notification.schema';

const NOTIFICATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function main() {
  const mongoUri =
    process.env.MONGO_URI ??
    `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.IP_DB}:27017/admin`;

  await mongoose.connect(mongoUri);
  const NotificationModel = mongoose.model(
    'NotificationSession',
    NotificationSessionSchema,
    'notificationsessions',
  );

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const mongoNotifications = await NotificationModel.find().lean();
  console.log(`Найдено в Mongo: ${mongoNotifications.length} уведомлений`);

  let migrated = 0;
  let skipped = 0;

  for (const notification of mongoNotifications) {
    // В Mongo expireAt — это момент создания, TTL-индекс докидывал 7 дней сверху.
    const createdAt = notification.expireAt ?? new Date();
    const expiresAt = new Date(createdAt.getTime() + NOTIFICATION_TTL_MS);

    if (expiresAt < new Date()) {
      skipped++;
      continue;
    }

    try {
      const { _id, ...text } = notification.text as Record<string, string> & {
        _id?: unknown;
      };
      void _id;

      await prisma.notification.create({
        data: {
          id: notification._id as unknown as string,
          text: text as Prisma.InputJsonObject,
          createdAt,
          expiresAt,
        },
      });
      migrated++;
    } catch (error) {
      skipped++;
      console.error(
        `Пропущено уведомление ${notification._id}:`,
        (error as Error).message,
      );
    }
  }

  console.log(`Перенесено: ${migrated}, пропущено (протухшие/ошибки): ${skipped}`);
  console.log(
    `Сверка после переноса: Postgres notifications=${await prisma.notification.count()}`,
  );

  await prisma.$disconnect();
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Ошибка миграции:', error);
  process.exit(1);
});
