// Одноразовый скрипт переноса Users + RefreshToken из Mongo в Postgres (Фаза 1, шаг 1).
//
// Как использовать:
//   1. Восстановить нужный бэкап в отдельный scratch-инстанс Mongo (не трогая прод):
//        mongorestore --uri="mongodb://user:pass@localhost:27017" /path/to/mongo_backup_*/
//      Либо, если это тестовый прогон — можно указать URI прямо на прод/VPS Mongo (скрипт только читает).
//   2. Убедиться, что DATABASE_URL в .env указывает на целевую Postgres.
//   3. Запустить:
//        MONGO_URI=mongodb://user:pass@localhost:27017/admin npx ts-node src/scripts/migrate-users-tokens-to-postgres.ts
//      Если MONGO_URI не задан — используется тот же адрес, что и в app.module.ts (DATABASE_USER/DATABASE_PASSWORD/IP_DB из .env).

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { UserSchema } from '../schemas/user.schema';
import { TokenSchema } from '../schemas/refreshToken.schema';

async function main() {
  const mongoUri =
    process.env.MONGO_URI ??
    `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.IP_DB}:27017/admin`;

  await mongoose.connect(mongoUri);
  const UserModel = mongoose.model('User', UserSchema, 'users');
  const TokenModel = mongoose.model('Token', TokenSchema, 'tokens');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const mongoUsers = await UserModel.find().lean();
  const mongoTokens = await TokenModel.find().lean();

  console.log(
    `Найдено в Mongo: ${mongoUsers.length} пользователей, ${mongoTokens.length} refresh-токенов`,
  );

  let usersMigrated = 0;
  let usersSkipped = 0;

  for (const mongoUser of mongoUsers) {
    try {
      await prisma.user.create({
        data: {
          id: mongoUser._id as unknown as string,
          email: mongoUser.email,
          nickname: mongoUser.nickname,
          passwordHash: mongoUser.password,
          role: mongoUser.role as unknown as Role,
          isGroupLeader: mongoUser.isGroupLeader ?? false,
          groupName: mongoUser.groupName ?? null,
          excludedMobs: mongoUser.excludedMobs ?? [],
        },
      });
      usersMigrated++;
    } catch (error) {
      usersSkipped++;
      console.error(
        `Пропущен пользователь ${mongoUser.email} (${mongoUser._id}):`,
        (error as Error).message,
      );
    }
  }

  console.log(
    `Перенесено пользователей: ${usersMigrated}, пропущено: ${usersSkipped}`,
  );

  let tokensMigrated = 0;
  let tokensSkipped = 0;

  for (const mongoToken of mongoTokens) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: mongoToken.email },
      });
      if (!user) {
        tokensSkipped++;
        console.warn(
          `Токен для ${mongoToken.email} пропущен — пользователь не перенесён`,
        );
        continue;
      }

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: mongoToken.refreshToken,
          expiresAt: mongoToken.expireAt,
        },
      });
      tokensMigrated++;
    } catch (error) {
      tokensSkipped++;
      console.error(
        `Пропущен токен для ${mongoToken.email}:`,
        (error as Error).message,
      );
    }
  }

  console.log(
    `Перенесено токенов: ${tokensMigrated}, пропущено: ${tokensSkipped}`,
  );

  const postgresUserCount = await prisma.user.count();
  const postgresTokenCount = await prisma.refreshToken.count();
  console.log(
    `Сверка после переноса: Postgres users=${postgresUserCount}, refresh_tokens=${postgresTokenCount}`,
  );

  await prisma.$disconnect();
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Ошибка миграции:', error);
  process.exit(1);
});
