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
import {UsersService} from "../users/users.service";

@Injectable()
export class BossesService {
    private bossModels: any
    constructor(
        @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
        @InjectModel(GranasBoss.name) private granasBossModel: Model<GranasBossDocument>,
        @InjectModel(EnigmaBoss.name) private enigmaBossModel: Model<EnigmaBossDocument>,
        @InjectModel(LogrusBoss.name) private logrusBossModel: Model<LogrusBossDocument>,
        private usersService: UsersService,
    ) {

        this.bossModels = [
            {server: "Гранас", model: this.granasBossModel},
            {server: "Логрус", model: this.logrusBossModel},
            {server: "Энигма", model: this.enigmaBossModel}
        ]
    }

    async createBoss(createBossDto: CreateBossDto) {
        const bossModel = this.bossModels.find(obj => obj.server === createBossDto.server).model;
        const newBoss = await bossModel.create(createBossDto)
        await newBoss.save()
        return newBoss.toObject()
    }

    async findBoss(getBossDto: GetBossDto) {
        const bossModel = this.bossModels.find(obj => obj.server === getBossDto.server).model;

        if (!Object.values(Servers).includes(getBossDto.server)){
            throw new BadRequestException('Not valid server')
        }

        if (!Object.values(BossTypes).includes(getBossDto.bossName)){
            throw new BadRequestException('Not valid boss name')
        }
        try {
            const boss = await bossModel.findOne({bossName: getBossDto.bossName}).lean().exec();
            if (!boss?._id) {
                throw new BadRequestException();
            }
            return boss;
        } catch (error){
            throw new BadRequestException('Boss not found');
        }
    }

    async findAllBossesByUser(email: string, server: Servers) {
        const bossModel = this.bossModels.find(obj => obj.server === server).model;
        const user = await this.usersService.findUser(email)
        const excludedBosses = user.excludedBosses
        const unavailableBosses = user.unavailableBosses
        const undisplayedBosses = excludedBosses.concat(unavailableBosses.filter((item) => excludedBosses.indexOf(item) < 0))
        const arrayOfObjectsUndisplayedBosses = undisplayedBosses.map(item => ({ bossName: item }));
        arrayOfObjectsUndisplayedBosses.push({bossName: 'Mocked Name of Boss'}) // coz $nor doesn't work with empty array
        return bossModel.find({$nor: arrayOfObjectsUndisplayedBosses}).lean().exec()
    }

    async updateByCooldownBoss(getBossDto: GetBossDto){
        const bossModel = this.bossModels.find(obj => obj.server === getBossDto.server).model;
        const boss = await this.findBoss(getBossDto), bossCooldownTime = boss.cooldownTime;
        return bossModel.updateOne({bossName: boss.bossName}, { $inc: {cooldown: 1, willResurrect: bossCooldownTime} })
    }

    async updateDeathOfBossNow(getBossDto: GetBossDto){
        const bossModel = this.bossModels.find(obj => obj.server === getBossDto.server).model;
        const boss = await this.findBoss(getBossDto)
        let nextResurrectTime = boss.cooldownTime + Date.now()
        return bossModel.updateOne({bossName: boss.bossName},{willResurrect: nextResurrectTime} )
    }

    async updateDeathOfBossDate(date: number, getBossDto: GetBossDto){
        const bossModel = this.bossModels.find(obj => obj.server === getBossDto.server).model;
        const boss = await this.findBoss(getBossDto)
        let nextResurrectTime = boss.cooldownTime + date
        return bossModel.updateOne({bossName: boss.bossName},{willResurrect: nextResurrectTime} )
    }

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