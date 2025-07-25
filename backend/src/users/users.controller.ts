import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
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
import { GetEmailFromToken } from '../decorators/getEmail.decorator';
import { Roles } from '../decorators/roles.decorator';
import {
  DeleteAllUsersDtoResponse,
  DeleteUserDtoResponse,
} from './dto/delete-user.dto';
import { IUser } from './user.interface';
import { PaginatedUsersDto } from './dto/findAll-user.dto';
import { BotSession } from '../schemas/telegram-bot.schema';

@ApiTags('Users API')
@UseGuards(RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(@Inject('IUser') private readonly userInterface: IUser) {}

  @Roles()
  @ApiOperation({ summary: 'Create User' })
  @Post()
  async create(@Body() createUserDto: CreateUserDtoRequest): Promise<User> {
    return new User(await this.userInterface.createUser(createUserDto));
  }

  @UseGuards(TokensGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get User' })
  @Get()
  async getOne(@GetEmailFromToken() email: string): Promise<User> {
    return new User(await this.userInterface.findUser(email));
  }

  @UseGuards(TokensGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a Specific User By Email or Nickname' })
  @Get('specific-user/:identifier')
  async getUserByEmailOrNickname(
    @Param('identifier') identifier: string,
  ): Promise<User> {
    return new User(await this.userInterface.findUser(identifier));
  }

  @UseGuards(TokensGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find All Users' })
  @Header('Cache-Control', 'public, max-age=180')
  @Get('/list')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PaginatedUsersDto> {
    return this.userInterface.findAll(page, limit);
  }

  @UseGuards(TokensGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change User Password' })
  @ApiOkResponse({ description: 'Success', type: ChangeUserPassDtoResponse })
  @Put('/change-password')
  changePassword(
    @GetEmailFromToken() email: string,
    @Body() updateUserPassDto: ChangeUserPassDtoRequest,
  ): Promise<ChangeUserPassDtoResponse> {
    return this.userInterface.changePassword(email, updateUserPassDto);
  }

  @Roles()
  @ApiOperation({ summary: 'Forgot User Password' })
  @ApiOkResponse({ description: 'Success', type: ForgotUserPassDtoResponse })
  @Put('/forgot-password')
  forgotPassword(
    @Body() forgotUserPassDto: ForgotUserPassDtoRequest,
  ): Promise<ForgotUserPassDtoResponse> {
    return this.userInterface.forgotPassword(forgotUserPassDto);
  }

  @UseGuards(TokensGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update User Excluded Mobs' })
  @Put('/excluded')
  async updateExcluded(
    @GetEmailFromToken() email: string,
    @Body() updateExcludedDto: UpdateExcludedDto,
  ): Promise<User> {
    return new User(
      await this.userInterface.updateExcluded(email, updateExcludedDto),
    );
  }

  @UseGuards(TokensGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update The User Role' })
  @ApiOkResponse({ description: 'Success', type: UpdateUserRoleDtoResponse })
  @Put('/role')
  updateRole(
    @Body() updateUserRoleDto: UpdateUserRoleDtoRequest,
  ): Promise<UpdateUserRoleDtoResponse> {
    return this.userInterface.updateRole(updateUserRoleDto);
  }

  @UseGuards(TokensGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete User By Email or Nickname' })
  @ApiOkResponse({ description: 'Success', type: DeleteUserDtoResponse })
  @Delete('/:identifier')
  deleteOne(
    @Param('identifier') identifier: string,
  ): Promise<DeleteUserDtoResponse> {
    return this.userInterface.deleteOne(identifier);
  }

  @UseGuards(TokensGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete All Users' })
  @ApiOkResponse({ description: 'Success', type: DeleteAllUsersDtoResponse })
  @Delete()
  deleteAll(): Promise<DeleteAllUsersDtoResponse> {
    return this.userInterface.deleteAll();
  }

  @UseGuards(TokensGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Timezone for Bot Session' })
  @ApiOkResponse({ description: 'Success', type: BotSession })
  @Put('/timezone')
  updateTimezone(
    @GetEmailFromToken() email: string,
    @Body('timezone') timezone: string,
  ): Promise<BotSession> {
    return this.userInterface.updateTimezone(email, timezone);
  }
}
