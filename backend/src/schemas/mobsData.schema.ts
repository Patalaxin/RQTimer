import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MobsTypes, Servers } from './mobs.enum';

export type MobsDataDocument = HydratedDocument<MobsData>;

@Schema({
  autoIndex: true,
})
export class MobsData {
  @ApiProperty()
  @Expose()
  @Prop()
  mobId: string;

  @ApiProperty()
  @Expose()
  @Prop()
  groupName: string;

  @ApiProperty()
  @Expose()
  @Prop({ default: null })
  respawnTime: number;

  @ApiProperty()
  @Expose()
  @Prop({ default: null, maxlength: 50 })
  comment: string;

  @ApiProperty()
  @Expose()
  @Prop({ default: null })
  deathTime: number;

  @ApiProperty()
  @Expose()
  @Prop({ default: 0 })
  cooldown: number;

  @ApiProperty()
  @Expose()
  @Prop({ default: false })
  respawnLost: boolean;

  @ApiProperty({ enum: Servers })
  @Expose()
  @Prop({ required: true })
  server: Servers;

  @Exclude()
  @Prop()
  __v: number;

  @ApiProperty({ enum: MobsTypes })
  @Expose()
  @Prop({ required: true })
  mobTypeAdditionalTime: MobsTypes;

  @Exclude()
  @Transform((value) => value.obj._id.toString())
  _id: string;

  constructor(partial: Partial<MobsData>) {
    Object.assign(this, partial);
  }
}

export const MobsDataSchema = SchemaFactory.createForClass(MobsData);

MobsDataSchema.index({ mobId: 1, groupName: 1, server: 1 }, { unique: true });
