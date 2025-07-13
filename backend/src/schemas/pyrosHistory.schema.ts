import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { Locations, MobName, Servers } from './mobs.enum';
import { RolesTypes } from './user.schema';
import { HistoryTypes } from '../history/history-types.interface';
import { ApiProperty } from '@nestjs/swagger';

export type PyrosHistoryDocument = HydratedDocument<PyrosHistory>;

@Schema({
  autoIndex: true,
})
export class PyrosHistory {
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
  mobId: string;

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

  @Expose()
  @Prop()
  location: Locations;

  @ApiProperty()
  @Prop()
  groupName: string;

  @Prop({ type: Date, expires: 259200, default: Date.now }) //  3 day live for history
  expireAt: Date;

  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<PyrosHistory>) {
    Object.assign(this, partial);
  }
}

export const PyrosHistorySchema = SchemaFactory.createForClass(PyrosHistory);
