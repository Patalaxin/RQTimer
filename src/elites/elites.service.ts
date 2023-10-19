import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import { Model} from "mongoose";
import {Token, TokenDocument} from "../schemas/refreshToken.schema";
import { EliteTypes, Servers} from "../schemas/bosses.enum";
import {GetEliteDto} from "./dto/get-elite.dto";
import {EnigmaElite, EnigmaEliteDocument} from "../schemas/enigmaElites.schema";
import {LogrusElite, LogrusEliteDocument} from "../schemas/logrusElites.schema";
import {GranasElite, GranasEliteDocument} from "../schemas/granasElites.schema";
import {CreateEliteDto} from "./dto/create-elite.dto";
import {UsersService} from "../users/users.service";
import {UpdateEliteDto} from "./dto/update-elite.dto";

@Injectable()
export class ElitesService {
    private elitesModels: any
    constructor(
        @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
        @InjectModel(GranasElite.name) private granasEliteModel: Model<GranasEliteDocument>,
        @InjectModel(EnigmaElite.name) private enigmaEliteModel: Model<EnigmaEliteDocument>,
        @InjectModel(LogrusElite.name) private logrusEliteModel: Model<LogrusEliteDocument>,
        private usersService: UsersService,
    ) {
        this.elitesModels = [
            {server: "Гранас", model: this.granasEliteModel},
            {server: "Логрус", model: this.logrusEliteModel},
            {server: "Энигма", model: this.enigmaEliteModel}
        ]
    }

    async createElite(createEliteDto: CreateEliteDto) {
          const eliteModel = this.elitesModels.find(obj => obj.server === createEliteDto.server).model;

          const newBoss = await eliteModel.create(createEliteDto)
          await newBoss.save()
          return newBoss.toObject()
    }

    async findElite(getEliteDto: GetEliteDto) {
        const eliteModel = this.elitesModels.find(obj => obj.server === getEliteDto.server).model;

        if (!Object.values(Servers).includes(getEliteDto.server)){
                throw new BadRequestException('Not valid server')
            }

        if (!Object.values(EliteTypes).includes(getEliteDto.eliteName)){
                throw new BadRequestException('Not valid elite name')
            }

        try {
                const elite = await eliteModel.findOne({eliteName: getEliteDto.eliteName}).lean().exec();
                if (!elite?._id) {
                    throw new BadRequestException();
                }

                return elite;

            } catch (error){
                throw new BadRequestException('Elite not found');
            }
    }


    async findAllEliteByUser(email: string, server: Servers) {
        const eliteModel = this.elitesModels.find(obj => obj.server === server).model;
        const { excludedElites, unavailableElites } = await this.usersService.findUser(email)

        const undisplayedElites = excludedElites.concat(unavailableElites.filter((item) => excludedElites.indexOf(item) === -1))

        const arrayOfObjectsUndisplayedElites = undisplayedElites.map(item => ({ eliteName: item }));
        arrayOfObjectsUndisplayedElites.push({eliteName: 'Mocked Name of Elite'}) // coz $nor doesn't work with empty array

        return eliteModel.find({$nor: arrayOfObjectsUndisplayedElites}).lean().exec();
    }

    async updateElite(server: string, eliteName: string, updateEliteDto: UpdateEliteDto){
        const eliteModel = this.elitesModels.find(obj => obj.server === server).model;
        return eliteModel.updateOne({eliteName: eliteName}, {$set: updateEliteDto}, { new: true }).lean().exec()
    }

    async updateByCooldownElite(getEliteDto: GetEliteDto){
        const eliteModel = this.elitesModels.find(obj => obj.server === getEliteDto.server).model;

        const { cooldownTime, eliteName } = await this.findElite(getEliteDto)

        return eliteModel.updateOne({eliteName: eliteName}, { $inc: {cooldown: 1, willResurrect: cooldownTime} })
    }

    async updateDeathOfElite(getEliteDto: GetEliteDto, date?: number) {
        const eliteModel = this.elitesModels.find(obj => obj.server === getEliteDto.server).model;
        const elite = await this.findElite(getEliteDto);
        let nextResurrectTime = elite.cooldownTime;

        nextResurrectTime += date || Date.now();

        return eliteModel.updateOne({eliteName: elite.eliteName}, {willResurrect: nextResurrectTime});
    }

    async deleteElite(server: string, eliteName: string){
        const eliteModel = this.elitesModels.find(obj => obj.server === server).model;
        return eliteModel.deleteOne({eliteName: eliteName})
    }

}