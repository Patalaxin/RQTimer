import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { MobName, Servers } from './mobs.enum';
import { TokenSchema } from './refreshToken.schema';
import { RolesTypes } from './user.schema';

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
  mobName: MobName;

  @Expose()
  @Prop({ required: true })
  nickname: string;

  @Expose()
  @Prop({ required: true })
  date: number;

  @Expose()
  @Prop()
  role: RolesTypes;

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

  @Prop({ type: Date, expires: 259200, default: Date.now }) //  3 day live for history
  expireAt: Date;

  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<LogrusHistory>) {
    Object.assign(this, partial);
  }
}

export const LogrusHistorySchema = SchemaFactory.createForClass(LogrusHistory);
TokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 259200 }); //  3 day live for history
