import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ElitesService } from './elites.service';
import { UsersModule } from '../users/users.module';
import { ElitesController } from './elites.controller';
import { GranasElite, GranasEliteSchema } from '../schemas/granasElites.schema';
import { EnigmaElite, EnigmaEliteSchema } from '../schemas/enigmaElites.schema';
import { LogrusElite, LogrusEliteSchema } from '../schemas/logrusElites.schema';
import { Token, TokenSchema } from '../schemas/refreshToken.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  providers: [ElitesService],
  exports: [ElitesService],
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: GranasElite.name, schema: GranasEliteSchema },
    ]),
    MongooseModule.forFeature([
      { name: EnigmaElite.name, schema: EnigmaEliteSchema },
    ]),
    MongooseModule.forFeature([
      { name: LogrusElite.name, schema: LogrusEliteSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
  ],
  controllers: [ElitesController],
})
export class ElitesModule {}