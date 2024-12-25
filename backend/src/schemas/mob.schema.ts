import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { MobsLocations, MobName, MobsTypes, ShortMobName } from './mobs.enum';
import { ApiProperty } from '@nestjs/swagger';

export type MobDocument = HydratedDocument<Mob>;

@Schema({
  autoIndex: true,
})
export class Mob {
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

  @ApiProperty({ enum: MobsLocations })
  @Expose()
  @Prop({ required: true })
  location: MobsLocations;

  @ApiProperty()
  @Expose()
  @Prop({ required: true })
  cooldownTime: number;

  @ApiProperty()
  @Expose()
  @Prop()
  image: string;

  @ApiProperty({ enum: MobsTypes })
  @Expose()
  @Prop({ required: true })
  mobType: MobsTypes;

  @ApiProperty()
  @Exclude()
  @Prop()
  __v: number;

  @ApiProperty()
  @Exclude()
  _id: mongoose.Types.ObjectId;

  constructor(partial: Partial<Mob>) {
    Object.assign(this, partial);
  }
}

export const MobSchema = SchemaFactory.createForClass(Mob);
MobSchema.index({ location: 1, mobName: 1 }, { unique: true });
