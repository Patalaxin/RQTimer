import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Token, TokenDocument} from "../schemas/refreshToken.schema";
import {GranasBoss, GranasBossDocument} from "../schemas/granasBosses.schema";
import {CreateBossDto} from "./dto/create-boss.dto";
import {EnigmaBoss, EnigmaBossDocument} from "../schemas/enigmaBosses.schema";
import {LogrusBoss, LogrusBossDocument} from "../schemas/logrusBosses.schema";
import {BossTypes, Servers} from "../schemas/bosses.enum";
import {GetBossDto} from "./dto/get-boss.dto";
import {GetEliteDto} from "../elites/dto/get-elite.dto";
import {UsersService} from "../users/users.service";

@Injectable()
export class BossesService {
    constructor(
        @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
        @InjectModel(GranasBoss.name) private granasBossModel: Model<GranasBossDocument>,
        @InjectModel(EnigmaBoss.name) private enigmaBossModel: Model<EnigmaBossDocument>,
        @InjectModel(LogrusBoss.name) private logrusBossModel: Model<LogrusBossDocument>,
        private usersService: UsersService,
    ) {}

    async createBoss(createBossDto: CreateBossDto) {

        switch (createBossDto.server){
            case 'Гранас':
                const newGranasBoss= await this.granasBossModel.create(createBossDto);
                await newGranasBoss.save()
                return newGranasBoss.toObject()
            case 'Энигма':
                const newEnigmaBoss= await this.enigmaBossModel.create(createBossDto);
                await newEnigmaBoss.save()
                return newEnigmaBoss.toObject()
            case 'Логрус':
                const newLogrusBoss= await this.logrusBossModel.create(createBossDto);
                await newLogrusBoss.save()
                return newLogrusBoss.toObject()
        }
    }

    async findBoss(getBossDto: GetBossDto) {
        try {

            if (!Object.values(Servers).includes(getBossDto.server)){
                throw new BadRequestException('Not valid server')
            }

            if (!Object.values(BossTypes).includes(getBossDto.bossName)){
                throw new BadRequestException('Not valid boss name')
            }

            switch (getBossDto.server) {
                case 'Гранас':
                    const granasBoss = await this.granasBossModel.findOne({bossName: getBossDto.bossName}).lean().exec();
                    if(!granasBoss._id){
                        throw new BadRequestException()
                    }
                    return granasBoss
                case 'Энигма':
                    const enigmaBoss = await  this.enigmaBossModel.findOne({bossName: getBossDto.bossName}).lean().exec();
                    if(!enigmaBoss._id){
                        throw new BadRequestException()
                    }
                    return enigmaBoss
                case 'Логрус':
                    const logrusBoss = await this.logrusBossModel.findOne({bossName: getBossDto.bossName}).lean().exec();
                    if(!logrusBoss._id){
                        throw new BadRequestException()
                    }
                    return logrusBoss
            }
        } catch (error) {
            throw new BadRequestException('Boss does not exist!')
        }
    }


    async findAllBossesByUser(email: string, server: Servers) {
        const user = await this.usersService.findUser(email)
        const excludedBosses = user.excludedBosses
        const unavailableBosses = user.unavailableBosses
        const undisplayedBosses = excludedBosses.concat(unavailableBosses.filter((item) => excludedBosses.indexOf(item) < 0))
        const arrayOfObjectsUndisplayedBosses = undisplayedBosses.map(item => ({ bossName: item }));
        arrayOfObjectsUndisplayedBosses.push({bossName: 'Mocked Name of Boss'}) // coz $nor doesn't work with empty array
        switch (server) {
            case 'Гранас':
                return this.granasBossModel.find({$nor: arrayOfObjectsUndisplayedBosses}).lean().exec();
            case 'Энигма':
                return this.enigmaBossModel.find({$nor: arrayOfObjectsUndisplayedBosses} ).lean().exec();
            case 'Логрус':
                return this.logrusBossModel.find({$nor: arrayOfObjectsUndisplayedBosses}).lean().exec();
        }
    }

    async updateByCooldownBoss(getBossDto: GetBossDto){
        const boss = await this.findBoss(getBossDto), bossCooldownTime = boss.cooldownTime;
        switch (getBossDto.server) {
            case 'Гранас':
                return this.granasBossModel.updateOne({bossName: boss.bossName}, { $inc: {cooldown: 1, willResurrect: bossCooldownTime} })
            case 'Энигма':
                return this.enigmaBossModel.updateOne({bossName: boss.bossName}, { $inc: {cooldown: 1, willResurrect: bossCooldownTime} })
            case 'Логрус':
                return this.logrusBossModel.updateOne({bossName: boss.bossName}, { $inc: {cooldown: 1, willResurrect: bossCooldownTime} })
        }
    }

    async updateDeathOfBossNow(getBossDto: GetBossDto){
        const boss = await this.findBoss(getBossDto)
        let nextResurrectTime = boss.cooldownTime + Date.now()
        switch (getBossDto.server) {
            case 'Гранас':
                return this.granasBossModel.updateOne({bossName: boss.bossName},{willResurrect: nextResurrectTime} )
            case 'Энигма':
                return this.enigmaBossModel.updateOne({bossName: boss.bossName},{willResurrect: nextResurrectTime} )
            case 'Логрус':
                return this.logrusBossModel.updateOne({bossName: boss.bossName},{willResurrect: nextResurrectTime} )
        }
    }

    async updateDeathOfBossDate(date: number, getBossDto: GetBossDto){
        const boss = await this.findBoss(getBossDto)
        let nextResurrectTime = boss.cooldownTime + date
        switch (getBossDto.server) {
            case 'Гранас':
                return this.granasBossModel.updateOne({bossName: boss.bossName},{willResurrect: nextResurrectTime} )
            case 'Энигма':
                return this.enigmaBossModel.updateOne({bossName: boss.bossName},{willResurrect: nextResurrectTime} )
            case 'Логрус':
                return this.logrusBossModel.updateOne({bossName: boss.bossName},{willResurrect: nextResurrectTime} )
        }
    }

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