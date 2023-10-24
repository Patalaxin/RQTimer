import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { BossTypes, Locations, Servers } from './bosses.enum';

export type LogrusBossDocument = HydratedDocument<LogrusBoss>;

@Schema({
  autoIndex: true,
})
export class LogrusBoss {
  @Expose()
  @Prop({
    type: String,
    default: function generateUUID() {
      return randomUUID();
    },
  })
  _id: string;

  @Expose()
  @Prop({ required: true })
  bossName: BossTypes;

  @Expose()
  @Prop()
  respawnText: string;

  @Expose()
  @Prop({ required: true })
  location: Locations;

  @Expose()
  @Prop({ required: true })
  willResurrect: number;

  @Expose()
  @Prop({ required: true, default: 0 })
  cooldown: number;

  @Expose()
  @Prop({ required: true })
  cooldownTime: number;

  @Expose()
  @Prop()
  image: string;

  @Expose()
  @Prop()
  server: Servers;

  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<LogrusBoss>) {
    Object.assign(this, partial);
  }
}

export const LogrusBossSchema = SchemaFactory.createForClass(LogrusBoss);
LogrusBossSchema.index({ bossName: 1, location: 1 }, { unique: true });
