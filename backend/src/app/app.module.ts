import { join, resolve } from 'path';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { MobModule } from '../mob/mob.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { UnixtimeModule } from '../unixtime/unixtime.module';
import * as process from 'process';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    MobModule,
    ConfigurationModule,
    UnixtimeModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => {
        return {
          uri: `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@185.65.105.220:27017/admin`,
        };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(resolve(), 'client'),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
