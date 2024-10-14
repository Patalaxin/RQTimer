import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { MobName, Servers } from './mobs.enum';
import { TokenSchema } from './refreshToken.schema';
import { RolesTypes } from './user.schema';
import { HistoryTypes } from '../history/history.interface';

export type HeliosHistoryDocument = HydratedDocument<HeliosHistory>;

@Schema({
  autoIndex: true,
})
export class HeliosHistory {
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
  historyTypes: HistoryTypes;

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

  constructor(partial: Partial<HeliosHistory>) {
    Object.assign(this, partial);
  }
}

export const HeliosHistorySchema = SchemaFactory.createForClass(HeliosHistory);
TokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 259200 }); //  3 day live for history
