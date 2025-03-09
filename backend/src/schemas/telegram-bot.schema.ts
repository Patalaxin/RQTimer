import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BotSessionDocument = HydratedDocument<BotSession>;

@Schema()
export class BotSession {
  @Prop({ required: true, unique: true })
  userId: number;

  @Prop()
  group: string;

  @Prop({ default: false })
  paused: boolean;
}

export const BotSessionSchema = SchemaFactory.createForClass(BotSession);
