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
    Put,
    UseInterceptors
} from '@nestjs/common';
import {CreateUserDto} from "./dto/create-user.dto";
import {UsersService} from "./users.service";
import {RolesTypes, User} from "../schemas/user.schema";
import {Roles} from "../decorators/roles.decorator";

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

   @Put('/updateUnavailable/:email')
    async updateUnavailable(@Param('email') email: string, @Body('unavailableBosses') unavailableBosses: string[], @Body('unavailableElites') unavailableElites: string[]){
        return await this.userService.updateUnavailable(email, unavailableBosses, unavailableElites)
   }


    @Put('/updateExcluded/:email')
    async updateExcluded(@Param('email') email: string, @Body('excludedBosses') excludedBosses: string[], @Body('excludedElites') excludedElites: string[]){
        return await this.userService.updateExcluded(email, excludedBosses, excludedElites)
    }

}
