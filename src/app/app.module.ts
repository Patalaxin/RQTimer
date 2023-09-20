import { Module } from '@nestjs/common';
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [UsersModule, AuthModule, MongooseModule.forRoot('mongodb+srv://spatalaxin:oqKWurYUYq1mzGxv@cluster0.tkjfgpb.mongodb.net/?retryWrites=true&w=majority')],
  controllers: [],
  providers: [],
})
export class AppModule {}
