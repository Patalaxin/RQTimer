import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import {Exclude} from "class-transformer";
import {randomUUID} from "crypto";

export type UserDocument = HydratedDocument<User>
@Schema()
export class User {

    @Prop({ type: String, default: function genUUID() {
            return randomUUID()
        }})
    _id: string

    @Prop({ unique: true, required: true })
    email: string;

    @Exclude()
    @Prop({ required: true })
    password: string;

    @Exclude()
    @Prop()
    __v: number

    @Prop({default: ''})
    refreshToken: string

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}

export const UserSchema = SchemaFactory.createForClass(User)