import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export type MobsDataDocument = HydratedDocument<MobsData>;

@Schema({
  autoIndex: true,
})
export class MobsData {
  @ApiProperty()
  @Expose()
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Mob' })
  mobId: mongoose.Types.ObjectId;

  @ApiProperty()
  @Expose()
  @Prop({ default: null })
  respawnTime: number;

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

  @ApiProperty()
  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<MobsData>) {
    Object.assign(this, partial);
  }
}

export const MobsDataSchema = SchemaFactory.createForClass(MobsData);
