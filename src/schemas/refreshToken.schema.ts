import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';

export type TokenDocument = HydratedDocument<Token>;
@Schema()
export class Token {
  @Expose()
  @Prop({
    type: String,
    default: function generateUUID(): string {
      return randomUUID();
    },
  })
  _id: string;

  @Exclude()
  @Prop()
  __v: number;

  @Expose()
  @Prop({ unique: true})
  email: string;

  @Expose()
  @Prop({ unique: true })
  nickname: string;

  @Exclude()
  @Prop({ default: '' })
  refreshToken: string;

  @Prop({ type: Date, expires: 2678400, default: Date.now }) //  31 day live for refreshToken
  expireAt: Date;

  constructor(partial: Partial<Token>) {
    Object.assign(this, partial);
  }
}

export const TokenSchema = SchemaFactory.createForClass(Token);
TokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 2678400 }); //  31 day live for refreshToken
