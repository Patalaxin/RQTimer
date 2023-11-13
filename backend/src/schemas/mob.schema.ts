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

export type MobDocument = HydratedDocument<Mob>;

@Schema({
  autoIndex: true,
})
export class Mob {
  @Expose()
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'MobsData' })
  mobsDataId: mongoose.Types.ObjectId;

  @Expose()
  @Prop({ required: true })
  mobName: MobName;

  @Expose()
  @Prop({ required: true })
  shortName: ShortMobName;

  @Expose()
  @Prop({ default: null })
  respawnText: string;

  @Expose()
  @Prop({ required: true })
  location: Locations;

  @Expose()
  @Prop({ required: true })
  cooldownTime: number;

  @Expose()
  @Prop()
  image: string;

  @Expose()
  @Prop()
  server: Servers;

  @Expose()
  @Prop({ required: true })
  mobType: MobsTypes;

  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<Mob>) {
    Object.assign(this, partial);
  }
}

export const MobSchema = SchemaFactory.createForClass(Mob);
// MobSchema.index({ bossName: 1, location: 1 }, { unique: true });
