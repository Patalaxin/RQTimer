// // src/scripts/migrate-history-servers.ts
// import { NestFactory } from '@nestjs/core';
// import { getModelToken } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { AppModule } from '../app/app.module';
// import {
//   IgnisHistory,
//   IgnisHistoryDocument,
// } from 'src/schemas/ignisHistory.schema';
// import {
//   PyrosHistory,
//   PyrosHistoryDocument,
// } from '../schemas/pyrosHistory.schema';
// import {
//   OrtosHistory,
//   OrtosHistoryDocument,
// } from '../schemas/ortosHistory.schema';
// import {
//   AztecHistory,
//   AztecHistoryDocument,
// } from '../schemas/aztecHistory.schema';
// import {
//   AstusHistory,
//   AstusHistoryDocument,
// } from '../schemas/astusHistory.schema';
// import {
//   FenixHistory,
//   FenixHistoryDocument,
// } from '../schemas/fenixHistory.schema';
// import {
//   SolusHistory,
//   SolusHistoryDocument,
// } from '../schemas/solusHistory.schema';
//
// async function migrateHistoryServers() {
//   const app = await NestFactory.createApplicationContext(AppModule);
//
//   const ignisModel = app.get<Model<IgnisHistoryDocument>>(
//     getModelToken(IgnisHistory.name),
//   );
//   const pyrosModel = app.get<Model<PyrosHistoryDocument>>(
//     getModelToken(PyrosHistory.name),
//   );
//   const ortosModel = app.get<Model<OrtosHistoryDocument>>(
//     getModelToken(OrtosHistory.name),
//   );
//   const aztecModel = app.get<Model<AztecHistoryDocument>>(
//     getModelToken(AztecHistory.name),
//   );
//   const astusModel = app.get<Model<AstusHistoryDocument>>(
//     getModelToken(AstusHistory.name),
//   );
//   const fenixModel = app.get<Model<FenixHistoryDocument>>(
//     getModelToken(FenixHistory.name),
//   );
//   const solusModel = app.get<Model<SolusHistoryDocument>>(
//     getModelToken(SolusHistory.name),
//   );
//
//   // --- MIGRATION MAP ---
//   const migrationMap = [
//     {
//       fromModels: [ignisModel, pyrosModel],
//       toModel: fenixModel,
//       newServer: 'Fenix',
//     },
//     {
//       fromModels: [ortosModel, aztecModel, astusModel],
//       toModel: solusModel,
//       newServer: 'Solus',
//     },
//   ];
//
//   for (const { fromModels, toModel, newServer } of migrationMap) {
//     console.log(`\n🚀 Начинаем миграцию в ${newServer}...`);
//
//     for (const fromModel of fromModels) {
//       const fromName = fromModel.modelName;
//
//       const count = await fromModel.countDocuments();
//       if (!count) {
//         console.log(`   ⚪ Коллекция ${fromName} пуста, пропускаем`);
//         continue;
//       }
//
//       console.log(
//         `   Найдено ${count} записей в ${fromName}, начинаем перенос...`,
//       );
//
//       const docs = await fromModel.find().lean();
//
//       // Обновляем поле server
//       const migrated = docs.map((doc) => ({
//         ...doc,
//         _id: undefined, // чтобы Mongo выдала новый _id
//         server: newServer,
//       }));
//
//       if (migrated.length) {
//         const res = await toModel.insertMany(migrated, { ordered: false });
//         console.log(`   ✅ Вставлено ${res.length} записей в ${newServer}`);
//
//         // После успешной вставки можно удалить оригиналы
//         await fromModel.deleteMany({});
//         console.log(`   🗑 Удалено ${count} записей из ${fromName}`);
//       }
//     }
//   }
//
//   console.log('\n🎉 Миграция всех историй завершена!');
//   await app.close();
// }
//
// migrateHistoryServers().catch((err) => {
//   console.error('❌ Ошибка миграции:', err);
//   process.exit(1);
// });
//
// // npx ts-node src/scripts/migrate-history-servers.ts
