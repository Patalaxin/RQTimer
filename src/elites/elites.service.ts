import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {get, Model} from "mongoose";
import {Token, TokenDocument} from "../schemas/refreshToken.schema";
import {BossTypes, EliteTypes, Servers} from "../schemas/bosses.enum";
import {GetEliteDto} from "./dto/get-elite.dto";
import {EnigmaElite, EnigmaEliteDocument} from "../schemas/enigmaElites.schema";
import {LogrusElite, LogrusEliteDocument} from "../schemas/logrusElites.schema";
import {GranasElite, GranasEliteDocument} from "../schemas/granasElites.schema";
import {CreateEliteDto} from "./dto/create-elite.dto";
import {GetBossDto} from "../bosses/dto/get-boss.dto";
import {UsersService} from "../users/users.service";

@Injectable()
export class ElitesService {
    constructor(
        @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
        @InjectModel(GranasElite.name) private granasEliteModel: Model<GranasEliteDocument>,
        @InjectModel(EnigmaElite.name) private enigmaEliteModel: Model<EnigmaEliteDocument>,
        @InjectModel(LogrusElite.name) private logrusEliteModel: Model<LogrusEliteDocument>,
        private usersService: UsersService,
    ) {}

    async createElite(createEliteDto: CreateEliteDto) {

        switch (createEliteDto.server){
            case 'Гранас':
                const newGranasElite= await this.granasEliteModel.create(createEliteDto);
                await newGranasElite.save()
                return newGranasElite.toObject()
            case 'Энигма':
                const newEnigmaElite= await this.enigmaEliteModel.create(createEliteDto);
                await newEnigmaElite.save()
                return newEnigmaElite.toObject()
            case 'Логрус':
                const newLogrusElite= await this.logrusEliteModel.create(createEliteDto);
                await newLogrusElite.save()
                return newLogrusElite.toObject()
        }
    }

    async findElite(getEliteDto: GetEliteDto) {
        try {

            if (!Object.values(Servers).includes(getEliteDto.server)){
                throw new BadRequestException('Not valid server')
            }

            if (!Object.values(EliteTypes).includes(getEliteDto.eliteName)){
                throw new BadRequestException('Not valid elite name')
            }

            switch (getEliteDto.server) {
                case 'Гранас':
                    const granasElite = await this.granasEliteModel.findOne({eliteName: getEliteDto.eliteName}).lean().exec();
                    if(!granasElite._id){
                        throw new BadRequestException()
                    }
                    return granasElite
                case 'Энигма':
                    const enigmaElite = await  this.enigmaEliteModel.findOne({eliteName: getEliteDto.eliteName}).lean().exec();
                    if(!enigmaElite._id){
                        throw new BadRequestException()
                    }
                    return enigmaElite
                case 'Логрус':
                    const logrusElite = await this.logrusEliteModel.findOne({eliteName: getEliteDto.eliteName}).lean().exec();
                    if(!logrusElite._id){
                        throw new BadRequestException()
                    }
                    return logrusElite
            }
        } catch (error) {
            throw new BadRequestException('Elite does not exist!')
        }
    }


    async findAllEliteByUser(email: string, server: Servers) {
        const user = await this.usersService.findUser(email)
        const excludedElites = user.excludedElites
        const unavailableElites = user.unavailableElites
        const undisplayedElites = excludedElites.concat(unavailableElites.filter((item) => excludedElites.indexOf(item) < 0))
        const arrayOfObjectsUndisplayedElites = undisplayedElites.map(item => ({ eliteName: item }));
        arrayOfObjectsUndisplayedElites.push({eliteName: 'Mocked Name of Elite'}) // coz $nor doesn't work with empty array
        switch (server) {
            case 'Гранас':
                return this.granasEliteModel.find({$nor: arrayOfObjectsUndisplayedElites}).lean().exec();
            case 'Энигма':
                return this.enigmaEliteModel.find({$nor: arrayOfObjectsUndisplayedElites}).lean().exec();
            case 'Логрус':
                return this.logrusEliteModel.find({$nor: arrayOfObjectsUndisplayedElites}).lean().exec();
        }
    }

    async updateByCooldownElite(getEliteDto: GetEliteDto){
        const elite = await this.findElite(getEliteDto), eliteCooldownTime = elite.cooldownTime
        console.log(elite)
        switch (getEliteDto.server) {
            case 'Гранас':
                return this.granasEliteModel.updateOne({eliteName: elite.eliteName}, { $inc: {cooldown: 1, willResurrect: eliteCooldownTime} })
            case 'Энигма':
                return this.enigmaEliteModel.updateOne({eliteName: elite.eliteName}, { $inc: {cooldown: 1, willResurrect: eliteCooldownTime} })
            case 'Логрус':
                return this.logrusEliteModel.updateOne({eliteName: elite.eliteName}, { $inc: {cooldown: 1, willResurrect: eliteCooldownTime} })
        }
    }


    async updateDeathOfEliteNow(getEliteDto: GetEliteDto){
        const elite = await this.findElite(getEliteDto)
        let nextResurrectTime = elite.cooldownTime + Date.now()
        switch (getEliteDto.server) {
            case 'Гранас':
                return this.granasEliteModel.updateOne({eliteName: elite.eliteName},{willResurrect: nextResurrectTime} )
            case 'Энигма':
                return this.enigmaEliteModel.updateOne({eliteName: elite.eliteName},{willResurrect: nextResurrectTime} )
            case 'Логрус':
                return this.logrusEliteModel.updateOne({eliteName: elite.eliteName},{willResurrect: nextResurrectTime} )
        }
    }

        async updateDeathOfEliteDate(date: number, getEliteDto: GetEliteDto){
            const elite = await this.findElite(getEliteDto)
            let nextResurrectTime = elite.cooldownTime + date
            switch (getEliteDto.server) {
                case 'Гранас':
                    return this.granasEliteModel.updateOne({eliteName: elite.eliteName},{willResurrect: nextResurrectTime} )
                case 'Энигма':
                    return this.enigmaEliteModel.updateOne({eliteName: elite.eliteName},{willResurrect: nextResurrectTime} )
                case 'Логрус':
                    return this.logrusEliteModel.updateOne({eliteName: elite.eliteName},{willResurrect: nextResurrectTime} )
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