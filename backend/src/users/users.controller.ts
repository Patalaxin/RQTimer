import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolesTypes, User } from '../schemas/user.schema';
import { CreateUserDtoRequest } from './dto/create-user.dto';
import { UpdateExcludedDto } from './dto/update-excluded.dto';
import {
  UpdateUserRoleDtoRequest,
  UpdateUserRoleDtoResponse,
} from './dto/update-user-role.dto';
import {
  ChangeUserPassDtoRequest,
  ChangeUserPassDtoResponse,
} from './dto/change-user-pass.dto';
import {
  ForgotUserPassDtoRequest,
  ForgotUserPassDtoResponse,
} from './dto/forgot-user-pass.dto';
import { RolesGuard } from '../guards/roles.guard';
import { TokensGuard } from '../guards/tokens.guard';
import { GetUser } from '../decorators/get-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import {
  DeleteAllUsersDtoResponse,
  DeleteUserDtoResponse,
} from './dto/delete-user.dto';
import { PaginatedUsersDto } from './dto/findAll-user.dto';
import { BotSession } from '../schemas/telegram-bot.schema';
import { UsersService } from './users.service';

@ApiTags('Users API')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create User' })
  @Post()
  create(@Body() createUserDto: CreateUserDtoRequest): Promise<User> {
    return this.usersService.createUser(createUserDto);
  }

  @UseGuards(TokensGuard, RolesGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get User' })
  @Get()
  getOne(@GetUser('email') email: string): Promise<User> {
    return this.usersService.findUser(email);
  }

  @UseGuards(TokensGuard, RolesGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a Specific User By Email or Nickname' })
  @Get('specific-user/:identifier')
  getUserByEmailOrNickname(
    @Param('identifier') identifier: string,
  ): Promise<User> {
    return this.usersService.findUser(identifier);
  }

  @UseGuards(TokensGuard, RolesGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find All Users' })
  @Header('Cache-Control', 'public, max-age=180')
  @Get('/list')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PaginatedUsersDto> {
    return this.usersService.findAll(page, limit);
  }

  @UseGuards(TokensGuard, RolesGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change User Password' })
  @ApiOkResponse({ description: 'Success', type: ChangeUserPassDtoResponse })
  @Put('/change-password')
  changePassword(
    @GetUser('email') email: string,
    @Body() updateUserPassDto: ChangeUserPassDtoRequest,
  ): Promise<ChangeUserPassDtoResponse> {
    return this.usersService.changePassword(email, updateUserPassDto);
  }

  @ApiOperation({ summary: 'Forgot User Password' })
  @ApiOkResponse({ description: 'Success', type: ForgotUserPassDtoResponse })
  @Put('/forgot-password')
  forgotPassword(
    @Body() forgotUserPassDto: ForgotUserPassDtoRequest,
  ): Promise<ForgotUserPassDtoResponse> {
    return this.usersService.forgotPassword(forgotUserPassDto);
  }

  @UseGuards(TokensGuard, RolesGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update User Excluded Mobs' })
  @Put('/excluded')
  updateExcluded(
    @GetUser('email') email: string,
    @Body() updateExcludedDto: UpdateExcludedDto,
  ): Promise<User> {
    return this.usersService.updateExcluded(email, updateExcludedDto);
  }

  @UseGuards(TokensGuard, RolesGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update The User Role' })
  @ApiOkResponse({ description: 'Success', type: UpdateUserRoleDtoResponse })
  @Put('/role')
  updateRole(
    @Body() updateUserRoleDto: UpdateUserRoleDtoRequest,
  ): Promise<UpdateUserRoleDtoResponse> {
    return this.usersService.updateRole(updateUserRoleDto);
  }

  @UseGuards(TokensGuard, RolesGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete User By Email or Nickname' })
  @ApiOkResponse({ description: 'Success', type: DeleteUserDtoResponse })
  @Delete('/:identifier')
  deleteOne(
    @Param('identifier') identifier: string,
  ): Promise<DeleteUserDtoResponse> {
    return this.usersService.deleteOne(identifier);
  }

  @UseGuards(TokensGuard, RolesGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete All Users' })
  @ApiOkResponse({ description: 'Success', type: DeleteAllUsersDtoResponse })
  @Delete()
  deleteAll(): Promise<DeleteAllUsersDtoResponse> {
    return this.usersService.deleteAll();
  }

  @UseGuards(TokensGuard, RolesGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Timezone for Bot Session' })
  @ApiOkResponse({ description: 'Success', type: BotSession })
  @Put('/timezone')
  updateTimezone(
    @GetUser('email') email: string,
    @Body('timezone') timezone: string,
  ): Promise<BotSession> {
    return this.usersService.updateTimezone(email, timezone);
  }

  @ApiOperation({ summary: 'Get Users Count' })
  @ApiOkResponse({ description: 'Success', schema: { example: { count: 42 } } })
  @Get('/stats/count')
  getUsersCount(): Promise<{ count: number }> {
    return this.usersService.getUsersCount();
  }
}
