import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
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
import { RolesTypes } from '../schemas/roles.enum';
import { UserResponseDto } from './dto/user-response.dto';
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
import { Public } from '../decorators/public.decorator';
import {
  DeleteAllUsersDtoResponse,
  DeleteUserDtoResponse,
} from './dto/delete-user.dto';
import { PaginatedUsersDto } from './dto/findAll-user.dto';
import { BotSession } from '@prisma/client';
import { UsersService } from './users.service';

@ApiTags('Users API')
@UseGuards(TokensGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Регистрация: токена у пользователя ещё нет и взяться ему неоткуда.
  @Public()
  @ApiOperation({ summary: 'Create User' })
  @Post()
  create(
    @Body() createUserDto: CreateUserDtoRequest,
  ): Promise<UserResponseDto> {
    return this.usersService.createUser(createUserDto);
  }

  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get User' })
  @Get()
  getOne(@GetUser('email') email: string): Promise<UserResponseDto> {
    return this.usersService.findUser(email);
  }

  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a Specific User By Email or Nickname' })
  @Get('specific-user/:identifier')
  getUserByEmailOrNickname(
    @Param('identifier') identifier: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findUser(identifier);
  }

  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find All Users' })
  @Header('Cache-Control', 'public, max-age=180')
  @Get('/list')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedUsersDto> {
    return this.usersService.findAll(page, limit);
  }

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

  // Восстановление пароля: вызывается ровно тогда, когда войти не получается.
  @Public()
  @ApiOperation({ summary: 'Forgot User Password' })
  @ApiOkResponse({ description: 'Success', type: ForgotUserPassDtoResponse })
  @Put('/forgot-password')
  forgotPassword(
    @Body() forgotUserPassDto: ForgotUserPassDtoRequest,
  ): Promise<ForgotUserPassDtoResponse> {
    return this.usersService.forgotPassword(forgotUserPassDto);
  }

  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update User Excluded Mobs' })
  @Put('/excluded')
  updateExcluded(
    @GetUser('email') email: string,
    @Body() updateExcludedDto: UpdateExcludedDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateExcluded(email, updateExcludedDto);
  }

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

  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete All Users' })
  @ApiOkResponse({ description: 'Success', type: DeleteAllUsersDtoResponse })
  @Delete()
  deleteAll(): Promise<DeleteAllUsersDtoResponse> {
    return this.usersService.deleteAll();
  }

  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Timezone for Bot Session' })
  @ApiOkResponse({ description: 'Success' })
  @Put('/timezone')
  updateTimezone(
    @GetUser('email') email: string,
    @Body('timezone') timezone: string,
  ): Promise<BotSession> {
    return this.usersService.updateTimezone(email, timezone);
  }

  // Счётчик показывается на экране входа, то есть до авторизации.
  @Public()
  @ApiOperation({ summary: 'Get Users Count' })
  @ApiOkResponse({ description: 'Success', schema: { example: { count: 42 } } })
  @Get('/stats/count')
  getUsersCount(): Promise<{ count: number }> {
    return this.usersService.getUsersCount();
  }
}
