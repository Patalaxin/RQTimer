import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Mob, MobSchema } from '../schemas/mob.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Mob.name, schema: MobSchema }])],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
})
export class ConfigurationModule {}
