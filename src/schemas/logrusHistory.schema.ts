import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { BossTypes, EliteTypes, Servers } from "./bosses.enum";

export type LogrusHistoryDocument = HydratedDocument<LogrusHistory>;

@Schema({
  autoIndex: true,
})
export class LogrusHistory {
  @Expose()
  @Prop({
    type: String,
    default: function generateUUID() {
      return randomUUID();
    },
  })
  _id: string;

  @Expose()
  @Prop()
  bossName: BossTypes;

  @Expose()
  @Prop()
  eliteName: EliteTypes;

  @Expose()
  @Prop({ required: true })
  nickname: string;

  // @Expose()
  // @Prop({ required: true })
  // action: number;

  @Expose()
  @Prop({ required: true })
  date: number;

  @Expose()
  @Prop()
  fromCooldown: number;

  @Expose()
  @Prop()
  toCooldown: number;

  @Expose()
  @Prop()
  toWillResurrect: number;

  @Expose()
  @Prop()
  crashServer: boolean;

  @Expose()
  @Prop()
  server: Servers;

  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<LogrusHistory>) {
    Object.assign(this, partial);
  }
}

export const LogrusHistorySchema = SchemaFactory.createForClass(LogrusHistory);
