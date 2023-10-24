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
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateExcludedDto } from './dto/update-excluded.dto';
import { UpdateUnavailableDto } from './dto/update-unavailable.dto';
import { RolesTypes, User } from '../schemas/user.schema';
import { SessionId } from '../schemas/sessionID.schema';
import { Roles } from '../decorators/roles.decorator';

// @UseGuards(UsersGuard)
@Controller('user')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/create')
  async create(@Body() createUserDto: CreateUserDto) {
    return new User(await this.userService.createUser(createUserDto));
  }

  @Roles(RolesTypes.User, RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':email')
  async getOne(@Param('email') email: string) {
    return new User(await this.userService.findUser(email));
  }

  @Roles(RolesTypes.User, RolesTypes.Admin)
  @Get()
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Roles(RolesTypes.User, RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @Put()
  async updateRole(
    @Body('email') email: string,
    @Body('role') role: RolesTypes,
  ) {
    return await this.userService.updateRole(email, role);
  }

  @Roles(RolesTypes.User, RolesTypes.Admin)
  @Delete('/deleteAll')
  async deleteAll() {
    return await this.userService.deleteAll();
  }

  @Roles(RolesTypes.User, RolesTypes.Admin)
  @Delete(':email')
  async deleteOne(@Param('email') email: string) {
    return await this.userService.deleteOne(email);
  }

  @Put('/updateUnavailable')
  async updateUnavailable(@Body() updateUnavailableDto: UpdateUnavailableDto) {
    return await this.userService.updateUnavailable(updateUnavailableDto);
  }

  @Put('/updateExcluded')
  async updateExcluded(@Body() updateExcludedDto: UpdateExcludedDto) {
    return await this.userService.updateExcluded(updateExcludedDto);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/generateSessionId')
  async generateSessionId() {
    try {
      return new SessionId(await this.userService.generateSessionId());
    } catch (error) {
      throw new HttpException('пепеджа', HttpStatus.BAD_REQUEST);
    }
  }
}
