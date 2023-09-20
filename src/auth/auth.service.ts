import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
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
        const payload = { sub: user.userId, email: user.email }
        return {
            access_token: await this.jwtService.signAsync(payload)
        };
    }
}
