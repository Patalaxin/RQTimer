import {BadRequestException, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {User, UserDocument} from "../schemas/user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import * as bcrypt from 'bcrypt';
import {Token, TokenDocument} from "../schemas/refreshToken.schema";
import { RolesTypes } from "../schemas/user.schema";
import {GranasBoss, GranasBossDocument} from "../schemas/granasBosses.schema";
import {CreateBossDto} from "./dto/create-boss.dto";
import {EnigmaBoss, EnigmaBossDocument} from "../schemas/enigmaBosses.schema";
import {LogrusBoss, LogrusBossDocument} from "../schemas/logrusBosses.schema";

@Injectable()
export class BossesService {
    constructor(
        @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
        @InjectModel(GranasBoss.name) private granasBossModel: Model<GranasBossDocument>,
        @InjectModel(EnigmaBoss.name) private enigmaBossModel: Model<EnigmaBossDocument>,
        @InjectModel(LogrusBoss.name) private logrusBossModel: Model<LogrusBossDocument>
    ) {}

    async createBoss(bossDto: CreateBossDto) {

        switch (bossDto.server){
            case 'Гранас':
                const newGranasBoss= await this.granasBossModel.create(bossDto);
                await newGranasBoss.save()
                return newGranasBoss.toObject()
            case 'Энигма':
                const newEnigmaBoss= await this.enigmaBossModel.create(bossDto);
                await newEnigmaBoss.save()
                return newEnigmaBoss.toObject()
            case 'Логрус':
                const newLogrusBoss= await this.logrusBossModel.create(bossDto);
                await newLogrusBoss.save()
                return newLogrusBoss.toObject()
        }
    }

    // async findBoss(bossName: string) {
    //     try {
    //         const boss = await this.bossModel.findOne({bossName: bossName}).lean().exec();
    //         if (!user._id){
    //             throw new BadRequestException()
    //         }
    //         return user
    //
    //     } catch (error) {
    //         throw new BadRequestException('User does not exist!')
    //     }
    // }
    //
    // async findAll(): Promise<User[]> {
    //     return this.bossModel.find().select({ email: 1, _id: 1 }).lean().exec();
    // }
    //
    // async updateRole(email: string, role: RolesTypes) {
    //     return this.bossModel.findOneAndUpdate({email: email}, {role: role}, { new: true }).lean().exec()
    // }
    //
    // async deleteAll(){
    //     return this.bossModel.deleteMany()
    // }
    //
    // async deleteOne(email: string){
    //     return this.bossModel.deleteOne({email: email})
    // }
}