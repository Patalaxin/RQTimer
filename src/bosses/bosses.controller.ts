import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post, Put,
    UseInterceptors
} from '@nestjs/common';
import {CreateBossDto} from "./dto/create-boss.dto";
import {RolesTypes, User} from "../schemas/user.schema";
import {Roles} from "../decorators/roles.decorator";
import {BossesService} from "./bosses.service";
import {GranasBoss} from "../schemas/granasBosses.schema";


// @UseGuards(UsersGuard)
@Controller('boss')
export class BossesController {
    constructor(private bossService: BossesService) {
    }

    @Roles()
    @UseInterceptors(ClassSerializerInterceptor)
    @Post('/create')
    async create(@Body() createBossDto: CreateBossDto){
        try {
            return new GranasBoss(await this.bossService.createBoss(createBossDto))
        } catch (error) {
            throw new HttpException('Boss not created', HttpStatus.BAD_REQUEST);
        }
    }
    //
    // @Roles(RolesTypes.User, RolesTypes.Admin)
    // @UseInterceptors(ClassSerializerInterceptor)
    // @Get(':email')
    // async getOne(@Param('email') email: string) {
    //     return new User(await this.bossService.findUser(email))
    // }
    //
    // @Roles(RolesTypes.User, RolesTypes.Admin)
    // @Get()
    // async findAll(): Promise<User[]> {
    //     return await this.bossService.findAll();
    // }
    //
    // @Roles(RolesTypes.User, RolesTypes.Admin)
    // @UseInterceptors(ClassSerializerInterceptor)
    // @Put()
    // async updateRole(@Body('email') email: string,@Body('role') role: RolesTypes ){
    //     return await this.bossService.updateRole(email, role)
    // }
    //
    // @Roles(RolesTypes.User, RolesTypes.Admin)
    // @Delete('/deleteAll')
    // async deleteAll(){
    //     return await this.bossService.deleteAll()
    // }
    //
    // @Roles(RolesTypes.User, RolesTypes.Admin)
    // @Delete(':email')
    // async deleteOne(@Param('email') email: string){
    //     return await this.bossService.deleteOne(email)
    // }

}
