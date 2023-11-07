import { join, resolve } from 'path';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { BossesModule } from '../bosses/bosses.module';
import { ElitesModule } from '../elites/elites.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as process from "process";

@Module({
  imports: [
    UsersModule,
    BossesModule,
    AuthModule,
    ElitesModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        uri: `mongodb+srv://${process.env.DATABASE_USER_TEST}:${process.env.DATABASE_PASSWORD_TEST}.mongodb.net/?retryWrites=true&w=majority`,
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(resolve(), 'client'),
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
