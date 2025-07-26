import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Servers } from './mobs.enum';
import { ApiProperty } from '@nestjs/swagger';

export type BotSessionDocument = HydratedDocument<BotSession>;

@Schema()
export class BotSession {
  @Prop({ required: true })
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

  @Prop({ type: String, default: null })
  timezone: string | null;
}

export const BotSessionSchema = SchemaFactory.createForClass(BotSession);
BotSessionSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      userId: { $type: 'number' },
    },
  },
);
