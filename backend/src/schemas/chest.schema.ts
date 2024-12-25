import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Servers } from './mobs.enum';
import { ChestsLocations, ChestsTypes } from './chest.enum';

export type ChestDataDocument = HydratedDocument<ChestData>;

@Schema({
  autoIndex: true,
})
export class ChestData {
  @ApiProperty()
  @Expose()
  @Prop()
  chestTypes: ChestsTypes;

  @ApiProperty()
  @Prop()
  groupName: string;

  @ApiProperty({ enum: Servers })
  @Expose()
  @Prop({ required: true })
  server: Servers;

  @ApiProperty({ enum: ChestsLocations })
  @Expose()
  @Prop({ required: true })
  location: ChestsLocations;

  @ApiProperty()
  @Expose()
  @Prop({ default: null })
  respawnTime: number;

  @ApiProperty()
  @Expose()
  @Prop({ default: null })
  openingTime: number;

  @ApiProperty()
  @Expose()
  @Prop({ default: null, maxlength: 50 })
  comment: string;

  @ApiProperty()
  @Expose()
  @Prop({ required: true })
  typeChestId: number;

  @ApiProperty()
  @Exclude()
  @Prop()
  __v: number;

  constructor(partial: Partial<ChestData>) {
    Object.assign(this, partial);
  }
}

export const ChestDataSchema = SchemaFactory.createForClass(ChestData);

ChestDataSchema.index({ location: 1, groupName: 1, chestTypes: 1 });
ChestDataSchema.index({ typeChestId: 1 });
ChestDataSchema.index({ respawnTime: 1, openingTime: 1 });
