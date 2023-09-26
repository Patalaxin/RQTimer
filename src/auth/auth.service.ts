import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../schemas/user.schema";
import {Model} from "mongoose";
import {jwtConstants} from "./constants";

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private usersService: UsersService,
        private jwtService: JwtService) {}

    async signIn(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findUser(email);
        const isPasswordMatch = await bcrypt.compare(
            pass,
            user.password
        );
        if (!isPasswordMatch) {
            throw new UnauthorizedException();
        }
        const payload = { email: user.email }
        const [access_token, refresh_token] = await Promise.all([this.jwtService.signAsync(payload, {secret: jwtConstants.secret}), this.jwtService.signAsync(payload, {secret: jwtConstants.secret2})])
        await this.userModel.updateOne({email}, {$set: {refreshToken: refresh_token}})
        return { access_token, refresh_token }

    }
}
