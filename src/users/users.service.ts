import { Injectable } from '@nestjs/common';
// import { User } from "../interfaces/user.interface";
import {User, UserDocument} from "../schemas/user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {CreateUserDto} from "./dto/create-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    }

    async findUser(email: string): Promise<User | undefined> {
        const user = await this.userModel.findOne({email: email});
        return user;
    }

    // async createUser(userDto: CreateUserDto): Promise<User> {
    //     const newUser= new this.userModel(User);
    //     return newUser.save();
    // }

    async createUser(userDTO: CreateUserDto): Promise<User> {
        const newUser= await this.userModel.create(userDTO);
        newUser.password = await bcrypt.hash(newUser.password, 10)
        return newUser.save();
    }
}