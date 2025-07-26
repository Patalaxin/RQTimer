import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose, Transform } from 'class-transformer';
import { Locations, MobName, MobsTypes, ShortMobName } from './mobs.enum';
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

  @ApiProperty({ enum: MobsTypes })
  @Expose()
  @Prop({ required: true })
  mobType: MobsTypes;

  @Exclude()
  @Prop()
  __v: number;

  @ApiProperty()
  @Expose()
  @Transform((value) => value.obj._id.toString())
  _id: string;

  constructor(partial: Partial<Mob>) {
    Object.assign(this, partial);
  }
}

export const MobSchema = SchemaFactory.createForClass(Mob);
MobSchema.index({ location: 1, mobName: 1 }, { unique: true });
