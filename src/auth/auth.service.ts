import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../schemas/user.schema";
import {Model} from "mongoose";
import {jwtConstants} from "./constants";
import {randomUUID} from "crypto";
import {Token, TokenDocument} from "../schemas/refreshToken.schema";
import {SignInDto} from "./dto/signIn.dto";

@Injectable()
export class AuthService {

    constructor(
        @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private usersService: UsersService,
        private jwtService: JwtService) {}

    private async addTokens(user: any){
        const payload = { email: user.email }
        const accessToken = await this.jwtService.signAsync(payload, {secret: jwtConstants.secret})
        const refreshToken=  randomUUID()
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)
        await this.tokenModel.findOneAndUpdate({email: user.email}, {refreshToken: hashedRefreshToken}, {
            new: true,
            upsert: true
        })
        return { accessToken, refreshToken }
    }

    async signIn(signInDto: SignInDto) {
        // const user = await this.usersService.findUser(signInDto.email);
        let user: User;
        try {
            if (signInDto.email) {
                user = await this.usersService.findUser(signInDto.email);
            } else if (signInDto.nickname) {
                user = await this.userModel.findOne({nickname: signInDto.nickname}).lean().exec();
                    if (!user._id){
                        throw new BadRequestException()
                    }
            } else {
                throw new BadRequestException()
            }
        } catch (error){
            throw new BadRequestException('pepega')
        }

        const isPasswordMatch = await bcrypt.compare(
            signInDto.password,
            user.password
        );
        if (!isPasswordMatch) {
            throw new UnauthorizedException();
        }
        return this.addTokens(user)
    }

    async exchangeRefresh(email: string, userRefreshToken: string) {
            const user = await this.usersService.findUser(email);
            const userFromAccessToken = await this.tokenModel.findOne({email: email})

            const isRefreshTokenCorrect =  await bcrypt.compare(
                userRefreshToken,
                userFromAccessToken.refreshToken
            )
            if (!isRefreshTokenCorrect) {
                throw new UnauthorizedException()
            }
            return this.addTokens(user)
    }
}
