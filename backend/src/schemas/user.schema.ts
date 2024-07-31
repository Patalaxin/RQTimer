import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { ApiProperty } from '@nestjs/swagger';
import { MobName } from './mobs.enum';

export type UserDocument = HydratedDocument<User>;

export enum RolesTypes {
  Admin = 'Admin',
  User = 'User',
  Manager = 'Manager',
}
@Schema()
export class User {
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
  @Expose()
  @Prop({ unique: true, required: true })
  email: string;

  @ApiProperty()
  @Expose()
  @Prop({ unique: true, required: true })
  nickname: string;

  @ApiProperty({
    description: 'Мобы которые не доступны пользователю',
    enum: MobName,
    isArray: true,
    example: [MobName.Архон, MobName.Эдвард],
  })
  @Expose()
  @Prop({ default: [] })
  unavailableMobs: string[];

  @ApiProperty({
    description: 'Мобы которых пользователь не хочет видеть',
    enum: MobName,
    isArray: true,
    example: [MobName.Архон, MobName.Хьюго],
  })
  @Expose()
  @Prop({ default: [] })
  excludedMobs: string[];

  @Exclude({ toPlainOnly: true })
  @Prop({ required: true })
  password: string;

  @Exclude({ toPlainOnly: true })
  @Prop()
  __v: number;

  @Prop({ default: RolesTypes.User })
  role: RolesTypes;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
