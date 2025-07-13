import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { randomUUID } from 'crypto';

export type NotificationDocument = HydratedDocument<NotificationSession>;

@Schema()
export class NotificationSession {
  @ApiProperty()
  @Expose()
  @Prop({
    type: String,
    default: function generateUUID() {
      return randomUUID();
    },
  })
  _id: string;

  @ApiProperty()
  @Prop({ default: null })
  text: string;

  @Prop({ type: Date, expires: 604800, default: Date.now }) //  7 day live for history
  expireAt: Date;
}

export const NotificationSessionSchema =
  SchemaFactory.createForClass(NotificationSession);
