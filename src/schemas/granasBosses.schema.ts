import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import {Exclude, Expose} from "class-transformer";
import {randomUUID} from "crypto";
import {BossTypes, Locations, Servers} from "./bosses.enum";
import {EnigmaBossSchema} from "./enigmaBosses.schema";

export type GranasBossDocument = HydratedDocument<GranasBoss>

@Schema({
    autoIndex: true,
})
export class GranasBoss {

    @Expose()
    @Prop({ type: String, default: function genUUID() {
            return randomUUID()
        }})
    _id: string

    @Expose()
    @Prop({ required: true })
    bossName: BossTypes;

    @Expose()
    @Prop()
    respawnText: string;

    @Expose()
    @Prop({ required: true })
    location: Locations;

    @Expose()
    @Prop({ required: true })
    willResurrect: number

    @Expose()
    @Prop({ required: true })
    cooldown: number

    @Expose()
    @Prop({ required: true })
    cooldownTime: number

    @Expose()
    @Prop()
    image: string

    @Expose()
    @Prop()
    server: Servers

    @Exclude()
    @Prop()
    __v: number


    constructor(partial: Partial<GranasBoss>) {
        Object.assign(this, partial);
    }
}

export const GranasBossSchema = SchemaFactory.createForClass(GranasBoss)
GranasBossSchema.index({ bossName: 1, location: 1}, { unique: true })