import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export type SessionIdDocument = HydratedDocument<SessionId>;

@Schema()
export class SessionId {
  @ApiProperty()
  @Expose()
  @Prop()
  _id: string;

  @Exclude()
  @Prop()
  __v: string;

  constructor(partial: Partial<SessionId>) {
    Object.assign(this, partial);
  }
}

export const SessionIdSchema = SchemaFactory.createForClass(SessionId);
