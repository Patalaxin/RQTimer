import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post, Put, Query,
    UseInterceptors
} from '@nestjs/common';
import {RolesTypes, User} from "../schemas/user.schema";
import {Roles} from "../decorators/roles.decorator";
import {ElitesService} from "./elites.service";
import {Servers} from "../schemas/bosses.enum";
import {CreateEliteDto} from "./dto/create-elite.dto";
import {GranasElite} from "../schemas/granasElites.schema";
import {GetEliteDto} from "./dto/get-elite.dto";
import {GetBossDto} from "../bosses/dto/get-boss.dto";

// @UseGuards(UsersGuard)
@Controller('elite')
export class ElitesController {
    constructor(private eliteService: ElitesService) {
    }

    @Roles()
    @UseInterceptors(ClassSerializerInterceptor)
    @Post('/create')
    async create(@Body() createEliteDto: CreateEliteDto){
        try {
            return new GranasElite(await this.eliteService.createElite(createEliteDto))
        } catch (error) {
            throw new HttpException('Elite not created', HttpStatus.BAD_REQUEST);
        }
    }

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':eliteName/:server/')
    async getOneElite(@Param() getEliteDto: GetEliteDto) {
        return new GranasElite(await this.eliteService.findElite(getEliteDto))
    } // there's no difference between Granas and other servers

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @Get('getAll/:email/:server/')
    async findAllEliteByUser(@Param('email') email: string, @Param('server') server: Servers) {
        return await this.eliteService.findAllEliteByUser(email, server);
    }

    @Roles()
    @UseInterceptors(ClassSerializerInterceptor)
    @Put('/updateByCooldownElite')
    async updateByCooldown(@Body() getEliteDto: GetEliteDto){
        try {
            return await this.eliteService.updateByCooldownElite(getEliteDto)
        } catch (error) {
            throw new HttpException('Cooldown not updated', HttpStatus.BAD_REQUEST);
        }
    }

    @Roles()
    @UseInterceptors(ClassSerializerInterceptor)
    @Put('/updateDeathOfEliteNow')
    async updateDeathOfEliteNow(@Body() getEliteDto: GetEliteDto){
        try {
            return await this.eliteService.updateDeathOfEliteNow(getEliteDto)
        } catch (error) {
            throw new HttpException('Resurrect Time not updated', HttpStatus.BAD_REQUEST);
        }
    }

    @Roles()
    @UseInterceptors(ClassSerializerInterceptor)
    @Put('/updateDeathOfEliteDate')
    async updateDeathOfEliteDate(@Body('date') date: number, @Body() getEliteDto: GetEliteDto){
        try {
            return await this.eliteService.updateDeathOfEliteDate(date, getEliteDto)
        } catch (error) {
            throw new HttpException('Resurrect Time not updated', HttpStatus.BAD_REQUEST);
        }
    }
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
