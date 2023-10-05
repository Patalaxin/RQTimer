import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import {Exclude, Expose} from "class-transformer";
import {randomUUID} from "crypto";

export type TokenDocument = HydratedDocument<Token>
@Schema()
export class Token {

    @Expose()
    @Prop({ type: String, default: function genUUID() {
            return randomUUID()
        }})
    _id: string

    @Exclude()
    @Prop()
    __v: number

    @Expose()
    @Prop({ unique: true, required: true })
    email: string;

    @Exclude()
    @Prop({default: ''})
    refreshToken: string

    @Prop({ type: Date,  expires: 10, default: Date.now })
    expireAt: Date

    constructor(partial: Partial<Token>) {
        Object.assign(this, partial);
    }
}

export const TokenSchema = SchemaFactory.createForClass(Token)
TokenSchema.index({"expireAt": 1}, {expireAfterSeconds: 10})