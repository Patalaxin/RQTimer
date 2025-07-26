import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { LanguageEnum } from './language.enum';

export type NotificationDocument = HydratedDocument<NotificationSession>;

/**
 * Генерирует схему полей для каждого языка в enum,
 * каждое поле — обязательная строка.
 */
function generateTextFieldSchema(): Record<string, any> {
  const schema: Record<string, any> = {};
  for (const langKey of Object.values(LanguageEnum)) {
    schema[langKey] = { type: String, required: true };
  }
  return schema;
}

@Schema()
export class NotificationSession {
  @ApiProperty()
  @Expose()
  @Prop({
    type: String,
    default: () => randomUUID(),
  })
  _id: string;

  @ApiProperty({
    type: Object,
  })
  @Prop({
    type: generateTextFieldSchema(),
    required: true,
  })
  text: Record<LanguageEnum, string>;

  @Prop({ type: Date, expires: 604800, default: Date.now }) // 7 дней TTL
  expireAt: Date;
}

export const NotificationSessionSchema =
  SchemaFactory.createForClass(NotificationSession);
