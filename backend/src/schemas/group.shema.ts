import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export type GroupDocument = HydratedDocument<Group>;

@Schema({
  timestamps: true,
  autoIndex: true,
})
export class Group {
  @ApiProperty()
  @Prop({ required: true, unique: true })
  name: string;

  @ApiProperty({ type: String })
  @Prop()
  groupLeader: string;

  @ApiProperty({ type: [String] })
  @Prop()
  members: string[];

  @ApiProperty({ type: String })
  @Prop({ default: null })
  @Exclude()
  inviteCode: string;

  @ApiProperty({ type: Date })
  @Prop({ default: null, expires: '15m' })
  @Exclude()
  inviteCodeCreatedAt: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
