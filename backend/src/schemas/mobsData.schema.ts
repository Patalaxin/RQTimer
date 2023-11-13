import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';

export type MobsDataDocument = HydratedDocument<MobsData>;

@Schema({
  autoIndex: true,
})
export class MobsData {
  @Expose()
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Mob' })
  mobId: mongoose.Types.ObjectId;

  @Expose()
  @Prop({ default: null })
  respawnTime: number;

  @Expose()
  @Prop({ default: null })
  deathTime: number;

  @Expose()
  @Prop({ default: 0 })
  cooldown: number;

  @Expose()
  @Prop({ default: false })
  respawnLost: boolean;

  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<MobsData>) {
    Object.assign(this, partial);
  }
}

export const MobsDataSchema = SchemaFactory.createForClass(MobsData);
