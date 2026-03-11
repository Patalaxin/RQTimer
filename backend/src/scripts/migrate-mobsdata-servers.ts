// import { NestFactory } from '@nestjs/core';
// import { getModelToken } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { AppModule } from '../app/app.module';
// import { MobsData, MobsDataDocument } from '../schemas/mobsData.schema';
//
// async function mergeSolusIntoFenix() {
//   const isDryRun = process.argv.includes('--dry-run');
//
//   const app = await NestFactory.createApplicationContext(AppModule);
//   const mobsDataModel = app.get<Model<MobsDataDocument>>(
//     getModelToken(MobsData.name),
//   );
//
//   console.log(
//     `🚀 Начинаем merge серверов solus → fenix (${isDryRun ? 'DRY-RUN' : 'РЕЖИМ ЗАПИСИ'})\n`,
//   );
//
//   const records = await mobsDataModel.find({ server: 'Solus' });
//
//   if (!records.length) {
//     console.log('⚪ Нет записей для сервера solus');
//     await app.close();
//     return;
//   }
//
//   let updated = 0;
//   let skipped = 0;
//
//   for (const record of records) {
//     const exists = await mobsDataModel.exists({
//       mobId: record.mobId,
//       groupName: record.groupName,
//       server: 'Fenix',
//     });
//
//     if (exists) {
//       skipped++;
//       continue;
//     }
//
//     if (!isDryRun) {
//       await mobsDataModel.updateOne(
//         { _id: record._id },
//         { $set: { server: 'Fenix' } },
//       );
//     }
//
//     updated++;
//   }
//
//   console.log(
//     `${isDryRun ? '🧩 [DRY-RUN]' : '✅'} solus → fenix: ` +
//       `обновлено ${updated}, пропущено ${skipped}, всего ${records.length}`,
//   );
//
//   console.log(
//     `\n🎉 Merge завершён (${isDryRun ? 'тестовый запуск' : 'реальный запуск'})`,
//   );
//
//   await app.close();
// }
//
// mergeSolusIntoFenix().catch((err) => {
//   console.error('❌ Ошибка миграции:', err);
//   process.exit(1);
// });
