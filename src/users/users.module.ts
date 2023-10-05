import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema} from "../schemas/user.schema";
import { UsersController } from './users.controller';
import {Token, TokenSchema} from "../schemas/refreshToken.schema";

@Module({
    providers: [UsersService],
    exports: [UsersService],
    imports: [
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}]),
        MongooseModule.forFeature([{name: Token.name, schema: TokenSchema}])
    ],
    controllers: [UsersController]
})
export class UsersModule {}
