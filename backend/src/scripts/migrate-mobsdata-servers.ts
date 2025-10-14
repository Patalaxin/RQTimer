// import { NestFactory } from '@nestjs/core';
// import { getModelToken } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { AppModule } from '../app/app.module';
// import { MobsData, MobsDataDocument } from '../schemas/mobsData.schema';
//
// async function migrateMobsDataServers() {
//   const isDryRun = process.argv.includes('--dry-run');
//   const app = await NestFactory.createApplicationContext(AppModule);
//   const mobsDataModel = app.get<Model<MobsDataDocument>>(
//     getModelToken(MobsData.name),
//   );
//
//   const serverMap: Record<string, string> = {
//     Игнис: 'Fenix',
//     Pyros: 'Fenix',
//     Ortos: 'Solus',
//     Aztec: 'Solus',
//     Astus: 'Solus',
//     Гелиос: 'Helios',
//   };
//
//   console.log(
//     `🚀 Начинаем миграцию MobsData серверов... (${isDryRun ? 'DRY-RUN' : 'РЕЖИМ ЗАПИСИ'})\n`,
//   );
//
//   for (const [oldServer, newServer] of Object.entries(serverMap)) {
//     const records = await mobsDataModel.find({ server: oldServer });
//     if (!records.length) {
//       console.log(`⚪ Нет записей для сервера ${oldServer}, пропускаем`);
//       continue;
//     }
//
//     let updated = 0;
//     let skipped = 0;
//
//     for (const record of records) {
//       const exists = await mobsDataModel.exists({
//         mobId: record.mobId,
//         groupName: record.groupName,
//         server: newServer,
//       });
//
//       if (exists) {
//         skipped++;
//         continue;
//       }
//
//       if (!isDryRun) {
//         await mobsDataModel.updateOne(
//           { _id: record._id },
//           { $set: { server: newServer } },
//         );
//       }
//       updated++;
//     }
//
//     console.log(
//       `${isDryRun ? '🧩 [DRY-RUN]' : '✅'} ${oldServer} → ${newServer}: ` +
//         `обновлено ${updated}, пропущено ${skipped}, всего ${records.length}`,
//     );
//   }
//
//   console.log(
//     `\n🎉 Миграция MobsData завершена (${isDryRun ? 'тестовый запуск' : 'реальный запуск'})`,
//   );
//   await app.close();
// }
//
// migrateMobsDataServers().catch((err) => {
//   console.error('❌ Ошибка миграции:', err);
//   process.exit(1);
// });
