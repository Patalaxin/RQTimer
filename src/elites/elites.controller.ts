import {
    Body,
    ClassSerializerInterceptor,
    Controller, Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post, Put,
    UseInterceptors
} from '@nestjs/common';
import {RolesTypes} from "../schemas/user.schema";
import {Roles} from "../decorators/roles.decorator";
import {ElitesService} from "./elites.service";
import {Servers} from "../schemas/bosses.enum";
import {CreateEliteDto} from "./dto/create-elite.dto";
import {GranasElite} from "../schemas/granasElites.schema";
import {GetEliteDto} from "./dto/get-elite.dto";
import {UpdateEliteDto} from "./dto/update-elite.dto";

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
    @Put('/updateElite/:eliteName/:server/')
    async updateElite(@Body() updateEliteDto: UpdateEliteDto, @Param('eliteName') eliteName: string,  @Param('server') server: string){
        try {
            return await this.eliteService.updateElite(server, eliteName, updateEliteDto)
        } catch (error) {
            throw new HttpException('Boss not updated', HttpStatus.BAD_REQUEST);
        }
    }

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @Delete(':eliteName/:server')
    async deleteOne(@Param('eliteName') eliteName: string, @Param('server') server: Servers){
        return await this.eliteService.deleteElite(server, eliteName)
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
    @Put('/updateDeathOfElite')
    async updateDeathOfEliteDate(@Body() getEliteDto: GetEliteDto, @Body('date') date?: number){
        try {
            return await this.eliteService.updateDeathOfElite(getEliteDto, date)
        } catch (error) {
            throw new HttpException('Resurrect Time not updated', HttpStatus.BAD_REQUEST);
        }
    }

}
