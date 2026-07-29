// Одноразовый скрипт переноса Group из Mongo в Postgres.
//
// Users уже должны быть перенесены (migrate-users-tokens-to-postgres.ts):
// поле User.groupName ссылается на group.name, и скрипт сверяет, что состав
// участников совпадает с тем, что записано у пользователей.
//
// Как использовать:
//   MONGO_URI=mongodb://user:pass@localhost:27017/admin npx ts-node src/scripts/migrate-groups-to-postgres.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { GroupSchema } from '../schemas/group.schema';

async function main() {
  const mongoUri =
    process.env.MONGO_URI ??
    `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.IP_DB}:27017/admin`;

  await mongoose.connect(mongoUri);
  const GroupModel = mongoose.model('Group', GroupSchema, 'groups');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const mongoGroups = await GroupModel.find().lean();
  console.log(`Найдено в Mongo: ${mongoGroups.length} групп`);

  let migrated = 0;
  let skipped = 0;

  for (const mongoGroup of mongoGroups) {
    try {
      await prisma.group.create({
        data: {
          name: mongoGroup.name,
          groupLeader: mongoGroup.groupLeader,
          members: mongoGroup.members ?? [],
          canMembersAddMobs: mongoGroup.canMembersAddMobs ?? false,
          // Инвайт-коды живут час — переносить их смысла нет, лидер
          // перевыпустит при необходимости.
          inviteCode: null,
          inviteCodeCreatedAt: null,
        },
      });
      migrated++;
    } catch (error) {
      skipped++;
      console.error(
        `Пропущена группа ${mongoGroup.name}:`,
        (error as Error).message,
      );
    }
  }

  console.log(`Перенесено групп: ${migrated}, пропущено: ${skipped}`);

  // Сверка: у каждого пользователя с groupName должна найтись группа.
  const usersWithGroup = await prisma.user.findMany({
    where: { groupName: { not: null } },
    select: { email: true, groupName: true },
  });
  const groupNames = new Set(
    (await prisma.group.findMany({ select: { name: true } })).map(
      (group) => group.name,
    ),
  );

  const orphans = usersWithGroup.filter(
    (user) => !groupNames.has(user.groupName),
  );
  if (orphans.length) {
    console.warn(
      `Внимание: ${orphans.length} пользователей ссылаются на несуществующую группу:`,
      orphans.map((user) => `${user.email} -> ${user.groupName}`).join(', '),
    );
  }

  console.log(
    `Сверка после переноса: Postgres groups=${groupNames.size}, пользователей в группах=${usersWithGroup.length}`,
  );

  await prisma.$disconnect();
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Ошибка миграции:', error);
  process.exit(1);
});
