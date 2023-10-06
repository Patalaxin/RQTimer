import {BadRequestException, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {User, UserDocument} from "../schemas/user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {CreateUserDto} from "./dto/create-user.dto";
import * as bcrypt from 'bcrypt';
import {Token, TokenDocument} from "../schemas/refreshToken.schema";
import { RolesTypes } from "../schemas/user.schema";

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) {}

    async createUser(userDTO: CreateUserDto) {
        const newUser= await this.userModel.create(userDTO);
        newUser.password = await bcrypt.hash(newUser.password, 10)
        await newUser.save()
        await this.tokenModel.create({email: newUser.email})
        return newUser.toObject()
    }

    async findUser(email: string) {
        try {
            const user = await this.userModel.findOne({email: email}).lean().exec();
            if (!user._id){
                throw new BadRequestException()
            }
            return user

        } catch (error) {
            throw new BadRequestException('User does not exist!')
        }
    }

    async findAll(): Promise<User[]> {
        return this.userModel.find().select({ email: 1, _id: 1 }).lean().exec();
    }

    async updateRole(email: string, role: RolesTypes) {
            return this.userModel.findOneAndUpdate({email: email}, {role: role}, { new: true }).lean().exec()
    }

    async deleteAll(){
        return this.userModel.deleteMany()
    }

    async deleteOne(email: string){
        return this.userModel.deleteOne({email: email})
    }

    async updateUnavailable(email: string, unavailableBosses?: string[], unavailableElites?: string[]){
        return this.userModel.findOneAndUpdate({email: email}, {unavailableBosses: unavailableBosses, unavailableElites: unavailableElites}, {new: true}).lean().exec()
    }

    async updateExcluded(email: string, excludedBosses?: string[], excludedElites?: string[]){

        return this.userModel.findOneAndUpdate({email: email}, {excludedBosses: excludedBosses, excludedElites: excludedElites}, {new: true}).lean().exec()
    }
}