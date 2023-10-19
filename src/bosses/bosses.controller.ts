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
import {RolesTypes} from "../schemas/user.schema";
import {Roles} from "../decorators/roles.decorator";
import {BossesService} from "./bosses.service";
import {GranasBoss} from "../schemas/granasBosses.schema";
import {Servers} from "../schemas/bosses.enum";
import {GetBossDto} from "./dto/get-boss.dto";
import {UpdateBossDto} from "./dto/update-boss.dto";


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

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':bossName/:server/')
    async getOneBoss(@Param() getBossDto: GetBossDto) {
        return new GranasBoss(await this.bossService.findBoss(getBossDto))
    } // there's no difference between Granas and other servers

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @Get('getAll/:email/:server/')
    async findAllBossesByUser(@Param('email') email: string, @Param('server') server: Servers) {
        return await this.bossService.findAllBossesByUser(email, server);
    }

    @Roles()
    @UseInterceptors(ClassSerializerInterceptor)
    @Put('/updateBoss/:bossName/:server/')
    async updateBoss(@Body() updateBossDto: UpdateBossDto, @Param('bossName') bossName: string,  @Param('server') server: Servers){
        try {
            return await this.bossService.updateBoss(server, bossName, updateBossDto)
        } catch (error) {
            throw new HttpException('Boss not updated', HttpStatus.BAD_REQUEST);
        }
    }

    @Roles(RolesTypes.User, RolesTypes.Admin)
    @Delete(':bossName/:server')
    async deleteOne(@Param('bossName') bossName: string, @Param('server') server: Servers){
        return await this.bossService.deleteBoss(server, bossName)
    }

    @Roles()
    @UseInterceptors(ClassSerializerInterceptor)
    @Put('/updateByCooldownBoss')
    async updateByCooldown(@Body() getBossDto: GetBossDto){
        try {
            return await this.bossService.updateByCooldownBoss(getBossDto)
        } catch (error) {
            throw new HttpException('Cooldown not updated', HttpStatus.BAD_REQUEST);
        }
    }

    @Roles()
    @UseInterceptors(ClassSerializerInterceptor)
    @Put('/updateDeathOfBoss')
    async updateDeathOfEliteDate(@Body() getBossDto: GetBossDto, @Body('date') date?: number){
        try {
            return await this.bossService.updateDeathOfBoss(getBossDto, date)
        } catch (error) {
            throw new HttpException('Resurrect Time not updated', HttpStatus.BAD_REQUEST);
        }
    }

}
