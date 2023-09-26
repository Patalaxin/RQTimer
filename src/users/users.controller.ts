import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    UseInterceptors
} from '@nestjs/common';
import {CreateUserDto} from "./dto/create-user.dto";
import {UsersService} from "./users.service";
import {User} from "../schemas/user.schema";

@Controller('user')
export class UsersController {
    constructor(private userSerivce: UsersService) {
    }
    @Post('/create')
    async create(@Body() createUserDto: CreateUserDto){
            try {
                const user = new User(await this.userSerivce.createUser(createUserDto))
                return user
            } catch (error) {
                console.log(error)
                throw new HttpException({
                    status: HttpStatus.FORBIDDEN,
                    error: 'Nah, smth went wrong!!!',
                }, HttpStatus.FORBIDDEN, {
                    cause: error
                });
            }
    }
    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':email')
    async getOne(@Param('email') email: string) {
        return new User(await this.userSerivce.findUser(email))
    }
}
