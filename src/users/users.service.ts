import { Injectable } from '@nestjs/common';
import {User, UserDocument} from "../schemas/user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {CreateUserDto} from "./dto/create-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    }

    async findUser(email: string) {
        const user = await this.userModel.findOne({email: email}).lean().exec()
        return user;
    }

    async createUser(userDTO: CreateUserDto) {
        const newUser= await this.userModel.create(userDTO);
        newUser.password = await bcrypt.hash(newUser.password, 10)
        await newUser.save()
        return {
            email: newUser.email
        }
    }
}