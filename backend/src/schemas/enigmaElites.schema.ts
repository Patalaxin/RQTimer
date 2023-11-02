import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { EliteTypes, Locations, MobsTypes, Servers, ShortEliteName } from "./mobs.enum";

export type EnigmaEliteDocument = HydratedDocument<EnigmaElite>;

@Schema({
  autoIndex: true,
})
export class EnigmaElite {
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
  eliteName: EliteTypes;

  @Expose()
  @Prop({ required: true })
  shortName: ShortEliteName;

  @Expose()
  @Prop({ required: true })
  location: Locations;

  @Expose()
  @Prop({ required: true })
  respawnTime: number;

  @Expose()
  @Prop()
  deathTime: number;

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

  @Expose()
  @Prop({ required: true })
  mobType: MobsTypes;

  @Expose()
  @Prop({ required: true, default: false })
  respawnLost: boolean;

  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<EnigmaElite>) {
    Object.assign(this, partial);
  }
}

export const EnigmaEliteSchema = SchemaFactory.createForClass(EnigmaElite);
EnigmaEliteSchema.index({ eliteName: 1, location: 1 }, { unique: true });