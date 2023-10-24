import { join, resolve } from 'path';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { BossesModule } from '../bosses/bosses.module';
import { ElitesModule } from '../elites/elites.module';

@Module({
  imports: [
    UsersModule,
    BossesModule,
    AuthModule,
    ElitesModule,
    MongooseModule.forRoot(
      'mongodb+srv://spatalaxin:oqKWurYUYq1mzGxv@cluster0.tkjfgpb.mongodb.net/?retryWrites=true&w=majority',
    ),
    ServeStaticModule.forRoot({
      rootPath: join(resolve(), 'client'),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
