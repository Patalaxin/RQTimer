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
  @Prop({
    type: [String],
    default: [],
    description: 'List of members in the format "nickname: email"',
  })
  members: string[];

  @ApiProperty({ type: Boolean, description: 'Can members add mobs' })
  @Prop({ default: false })
  canMembersAddMobs: boolean;

  @ApiProperty({ type: String })
  @Prop({ default: null })
  @Exclude()
  inviteCode: string;

  @ApiProperty({ type: Date })
  @Prop({ default: null })
  @Exclude()
  inviteCodeCreatedAt: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
