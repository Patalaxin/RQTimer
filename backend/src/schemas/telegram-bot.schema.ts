import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Servers } from './mobs.enum';
import { ApiProperty } from '@nestjs/swagger';

export type BotSessionDocument = HydratedDocument<BotSession>;

@Schema()
export class BotSession {
  @Prop({ required: true, unique: true })
  userId: number;

  @Prop()
  email: string;

  @ApiProperty()
  @Prop({ default: null })
  groupName: string;

  @Prop({ type: String, default: null })
  server: Servers | null;

  @Prop({ default: false })
  paused: boolean;

  @Prop({ default: false })
  isVerified: boolean;
}

export const BotSessionSchema = SchemaFactory.createForClass(BotSession);
