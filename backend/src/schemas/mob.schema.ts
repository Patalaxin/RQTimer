import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import {
  Locations,
  MobName,
  MobsTypes,
  Servers,
  ShortMobName,
} from './mobs.enum';
import { ApiProperty } from '@nestjs/swagger';

export type MobDocument = HydratedDocument<Mob>;

@Schema({
  autoIndex: true,
})
export class Mob {
  @ApiProperty()
  @Exclude()
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'MobsData' })
  mobsDataId: mongoose.Types.ObjectId;

  @ApiProperty({ enum: MobName })
  @Expose()
  @Prop({ required: true })
  mobName: MobName;

  @ApiProperty({ enum: ShortMobName })
  @Expose()
  @Prop({ required: true })
  shortName: ShortMobName;

  @ApiProperty()
  @Expose()
  @Prop({ default: null })
  respawnText: string;

  @ApiProperty({ enum: Locations })
  @Expose()
  @Prop({ required: true })
  location: Locations;

  @ApiProperty()
  @Expose()
  @Prop({ required: true })
  cooldownTime: number;

  @ApiProperty()
  @Expose()
  @Prop()
  image: string;

  @ApiProperty({ enum: Servers })
  @Expose()
  @Prop()
  server: Servers;

  @ApiProperty({ enum: MobsTypes })
  @Expose()
  @Prop({ required: true })
  mobType: MobsTypes;

  @ApiProperty()
  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<Mob>) {
    Object.assign(this, partial);
  }
}

export const MobSchema = SchemaFactory.createForClass(Mob);
