// Одноразовый скрипт переноса справочника мобов из Mongo в Postgres.
//
// ВАЖНО: _id мобов переносятся один в один. На них завязаны переводы
// (mob/mobs-translations.ts), MobsData.mobId, History.mobId и фронт — если
// сгенерировать новые идентификаторы, отвалится всё перечисленное.
// Скрипт отдельно сверяет, что каждый ключ из mobs-translations нашёл своего
// моба в Postgres.
//
// Как использовать:
//   MONGO_URI=mongodb://user:pass@localhost:27017/admin npx ts-node src/scripts/migrate-mobs-to-postgres.ts

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { MobSchema } from '../schemas/mob.schema';
import { mobTranslations } from '../mob/mobs-translations';

async function main() {
  const mongoUri =
    process.env.MONGO_URI ??
    `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.IP_DB}:27017/admin`;

  await mongoose.connect(mongoUri);
  const MobModel = mongoose.model('Mob', MobSchema, 'mobs');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const mongoMobs = await MobModel.find().lean();
  console.log(`Найдено в Mongo: ${mongoMobs.length} мобов`);

  let migrated = 0;
  let skipped = 0;

  for (const mongoMob of mongoMobs) {
    try {
      await prisma.mob.create({
        data: {
          id: String(mongoMob._id),
          mobName: mongoMob.mobName,
          shortName: mongoMob.shortName,
          respawnText: mongoMob.respawnText ?? null,
          location: mongoMob.location,
          cooldownTime: mongoMob.cooldownTime,
          image: mongoMob.image ?? null,
          mobType: mongoMob.mobType,
        },
      });
      migrated++;
    } catch (error) {
      skipped++;
      console.error(
        `Пропущен моб ${mongoMob.mobName} (${mongoMob._id}):`,
        (error as Error).message,
      );
    }
  }

  console.log(`Перенесено мобов: ${migrated}, пропущено: ${skipped}`);

  // Сверка: идентификаторы должны совпасть с ключами таблицы переводов.
  const postgresIds = new Set(
    (await prisma.mob.findMany({ select: { id: true } })).map((mob) => mob.id),
  );
  const orphanTranslations = Object.keys(mobTranslations).filter(
    (id) => !postgresIds.has(id),
  );

  if (orphanTranslations.length) {
    console.warn(
      `Внимание: ${orphanTranslations.length} переводов не нашли моба в Postgres — эти мобы останутся без перевода:`,
      orphanTranslations.join(', '),
    );
  } else {
    console.log('Все ключи mobs-translations сошлись с id мобов в Postgres.');
  }

  console.log(`Сверка после переноса: Postgres mobs=${postgresIds.size}`);

  await prisma.$disconnect();
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Ошибка миграции:', error);
  process.exit(1);
});
