import { Module } from '@nestjs/common';
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { MongooseModule } from '@nestjs/mongoose';
import { BossesModule } from "../bosses/bosses.module";
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, resolve } from 'path';

@Module({
  imports: [
    UsersModule,
    BossesModule,
    AuthModule,
    MongooseModule.forRoot('mongodb+srv://spatalaxin:oqKWurYUYq1mzGxv@cluster0.tkjfgpb.mongodb.net/?retryWrites=true&w=majority'),
    ServeStaticModule.forRoot({
      rootPath: join(resolve(), 'client'),
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
