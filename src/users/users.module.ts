
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema} from "../schemas/user.schema";
import { UsersController } from './users.controller';

@Module({
    providers: [UsersService],
    exports: [UsersService],
    imports: [MongooseModule.forFeature([{name: User.name, schema: UserSchema}])],
    controllers: [UsersController]
})
export class UsersModule {}
