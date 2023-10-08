import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Put, Res,
    UseInterceptors
} from '@nestjs/common';
import {CreateUserDto} from "./dto/create-user.dto";
import {UsersService} from "./users.service";
import {RolesTypes, User} from "../schemas/user.schema";
import {Roles} from "../decorators/roles.decorator";
import {UpdateExcludedDto} from "./dto/update-excluded.dto";
import {UpdateUnavailableDto} from "./dto/update-unavailable.dto";
import * as http from "http";

// @UseGuards(UsersGuard)
@Controller('user')
export class UsersController {
    constructor(private userService: UsersService) {
    }

    @Roles()
    @UseInterceptors(ClassSerializerInterceptor)
    @Post('/create')
    async create(@Body() createUserDto: CreateUserDto){
            try {
                return new User(await this.userService.createUser(createUserDto))
            } catch (error) {
                throw new HttpException('User not created', HttpStatus.BAD_REQUEST);
            }
    }

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':email')
    async getOne(@Param('email') email: string) {
        return new User(await this.userService.findUser(email))
    }

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @Get()
    async findAll(): Promise<User[]> {
        return await this.userService.findAll();
    }

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @UseInterceptors(ClassSerializerInterceptor)
    @Put()
    async updateRole(@Body('email') email: string,@Body('role') role: RolesTypes ){
        return await this.userService.updateRole(email, role)
    }

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @Delete('/deleteAll')
    async deleteAll(){
        return await this.userService.deleteAll()
    }

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @Delete(':email')
    async deleteOne(@Param('email') email: string){
        return await this.userService.deleteOne(email)
    }

   @Put('/updateUnavailable')
    async updateUnavailable(@Body() updateUnavailableDto: UpdateUnavailableDto){
        return await this.userService.updateUnavailable(updateUnavailableDto)
    }

    @Put('/updateExcluded')
    async updateExcluded(@Body() updateExcludedDto: UpdateExcludedDto){
        return await this.userService.updateExcluded(updateExcludedDto)
    }

}
