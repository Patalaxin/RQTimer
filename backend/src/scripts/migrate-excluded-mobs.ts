// // src/scripts/migrate-excluded-mobs.ts
// import { NestFactory } from '@nestjs/core';
// import { getModelToken } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { User, UserDocument } from '../schemas/user.schema';
// import { Mob, MobDocument } from '../schemas/mob.schema';
// import { AppModule } from '../app/app.module';
//
// async function migrateExcludedMobs() {
//   const app = await NestFactory.createApplicationContext(AppModule);
//   const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
//   const mobModel = app.get<Model<MobDocument>>(getModelToken(Mob.name));
//
//   const users = await userModel.find({
//     excludedMobs: { $exists: true, $not: { $size: 0 } },
//   });
//
//   for (const user of users) {
//     if (!user || !user.excludedMobs.length) {
//       console.log('Пользователь не найден или excludedMobs пустой');
//       await app.close();
//       return;
//     }
//
//     // Получаем соответствующие мобы
//     const mobDocs = await mobModel.find({
//       mobName: { $in: user.excludedMobs },
//     });
//
//     const nameToIds = new Map<string, string[]>();
//     mobDocs.forEach((mob) => {
//       const name = mob.mobName;
//       const id = mob._id.toString();
//       if (!nameToIds.has(name)) {
//         nameToIds.set(name, []);
//       }
//       nameToIds.get(name).push(id);
//     });
//
//     // Собираем все ID, соответствующие имени
//     const updatedExcludedMobs: string[] = [];
//
//     user.excludedMobs.forEach((name) => {
//       const ids = nameToIds.get(name);
//       if (ids?.length) {
//         updatedExcludedMobs.push(...ids);
//       }
//     });
//
//     user.excludedMobs = updatedExcludedMobs;
//
//     await user.save();
//
//     console.log(`Обновлен пользователь ${user.nickname} (${user._id})`);
//   }
//   await app.close();
//   console.log('🎉 Миграция завершена');
// }
//
// migrateExcludedMobs().catch((err) => {
//   console.error('Ошибка миграции:', err);
//   process.exit(1);
// });
//
// // чтобы запустить - вызвать npx ts-node src/scripts/migrate-excluded-mobs.ts
