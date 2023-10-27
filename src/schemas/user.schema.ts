import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude, Expose } from 'class-transformer';
import { randomUUID } from 'crypto';
import { ApiProperty } from '@nestjs/swagger';
import { BossTypes, EliteTypes } from './mobs.enum';

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
    description: 'Боссы которые не доступны пользователю',
    enum: BossTypes,
    isArray: true,
    example: [BossTypes.Аркон, BossTypes.Эдвард],
  })
  @Expose()
  @Prop({ default: [] })
  unavailableBosses: string[];

  @ApiProperty({
    description: 'Элита которые не доступны пользователю',
    enum: EliteTypes,
    isArray: true,
    example: [EliteTypes.Слепоглаз, EliteTypes.Хозяин],
  })
  @Expose()
  @Prop({ default: [] })
  unavailableElites: string[];

  @ApiProperty({
    description: 'Боссы которых пользователь не хочет видеть',
    enum: BossTypes,
    isArray: true,
    example: [BossTypes.Архон, BossTypes.Хьюго],
  })
  @Expose()
  @Prop({ default: [] })
  excludedBosses: string[];

  @ApiProperty({
    description: 'Элита которых пользователь не хочет видеть',
    enum: EliteTypes,
    isArray: true,
    example: [EliteTypes.Лякуша, EliteTypes.Пламярык],
  })
  @Expose()
  @Prop({ default: [] })
  excludedElites: string[];

  @Exclude({ toPlainOnly: true })
  @Prop({ required: true })
  password: string;

  @Exclude({ toPlainOnly: true })
  @Prop()
  __v: number;

  @Exclude()
  @Prop({ default: RolesTypes.User })
  role: RolesTypes;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
