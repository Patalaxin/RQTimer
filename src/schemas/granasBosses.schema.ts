import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { BossTypes, Locations, MobsTypes, Servers, ShortBossName } from "./mobs.enum";

export type GranasBossDocument = HydratedDocument<GranasBoss>;

@Schema({
  autoIndex: true,
})
export class GranasBoss {
  @Expose()
  @Prop({
    type: String,
    default: function generateUUID() {
      return randomUUID();
    },
  })
  _id: string;

  @Expose()
  @Prop({ required: true })
  bossName: BossTypes;

  @Expose()
  @Prop({ required: true })
  shortName: ShortBossName;

  @Expose()
  @Prop()
  respawnText: string;

  @Expose()
  @Prop({ required: true })
  location: Locations;

  @Expose()
  @Prop({ required: true })
  respawnTime: number;

  @Expose()
  @Prop({ required: true, default: 0 })
  cooldown: number;

  @Expose()
  @Prop({ required: true })
  cooldownTime: number;

  @Expose()
  @Prop()
  image: string;

  @Expose()
  @Prop()
  server: Servers;

  @Exclude()
  @Prop()
  __v: number;

  @Expose()
  @Prop({ required: true })
  mobType: MobsTypes;

  constructor(partial: Partial<GranasBoss>) {
    Object.assign(this, partial);
  }
}

export const GranasBossSchema = SchemaFactory.createForClass(GranasBoss);
GranasBossSchema.index({ bossName: 1, location: 1 }, { unique: true });
