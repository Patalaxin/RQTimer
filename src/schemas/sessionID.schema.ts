import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Expose } from 'class-transformer';

export type SessionIdDocument = HydratedDocument<SessionId>;

@Schema()
export class SessionId {
  @Expose()
  @Prop()
  _id: string;

  constructor(partial: Partial<SessionId>) {
    Object.assign(this, partial);
  }
}

export const SessionIdSchema = SchemaFactory.createForClass(SessionId);
