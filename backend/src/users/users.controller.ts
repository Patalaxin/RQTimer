import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
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
import { SessionId } from '../schemas/sessionID.schema';
import { CreateUserDtoRequest } from './dto/create-user.dto';
import { UpdateExcludedDto } from './dto/update-excluded.dto';
import {
  UpdateUserRoleDtoRequest,
  UpdateUserRoleDtoResponse,
} from './dto/update-user-role.dto';
import { UpdateUnavailableDto } from './dto/update-unavailable.dto';
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
import { IUser } from '../domain/user/user.interface';
import { FindAllUsersDtoResponse } from './dto/findAll-user.dto';

@ApiTags('User API')
@UseGuards(RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('user')
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
  @Get('specificUser/:nicknameOrEmail')
  async getUserByEmailOrNickname(
    @Param('nicknameOrEmail') nicknameOrEmail: string,
  ): Promise<User> {
    return new User(await this.userInterface.findUser(nicknameOrEmail));
  }

  @UseGuards(TokensGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find All Users' })
  @Get('/findAll')
  findAll(): Promise<FindAllUsersDtoResponse[]> {
    return this.userInterface.findAll();
  }

  @UseGuards(TokensGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change User Password' })
  @ApiOkResponse({ description: 'Success', type: ChangeUserPassDtoResponse })
  @Put('/changePassword')
  changePassword(
    @GetEmailFromToken() email: string,
    @Body() updateUserPassDto: ChangeUserPassDtoRequest,
  ): Promise<ChangeUserPassDtoResponse> {
    return this.userInterface.changePassword(email, updateUserPassDto);
  }

  @Roles()
  @ApiOperation({ summary: 'Forgot User Password' })
  @ApiOkResponse({ description: 'Success', type: ForgotUserPassDtoResponse })
  @Put('/forgotPassword')
  forgotPassword(
    @Body() forgotUserPassDto: ForgotUserPassDtoRequest,
  ): Promise<ForgotUserPassDtoResponse> {
    return this.userInterface.forgotPassword(forgotUserPassDto);
  }

  @UseGuards(TokensGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update User Unavailable Mobs' })
  @Put('/updateUnavailable')
  async updateUnavailable(
    @Body() updateUnavailableDto: UpdateUnavailableDto,
  ): Promise<User> {
    return new User(
      await this.userInterface.updateUnavailable(updateUnavailableDto),
    );
  }

  @UseGuards(TokensGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update User Excluded Mobs' })
  @Put('/updateExcluded')
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
  @Put('/updateRole')
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
  @Delete('/deleteAll')
  deleteAll(): Promise<DeleteAllUsersDtoResponse> {
    return this.userInterface.deleteAll();
  }

  @UseGuards(TokensGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Session Id' })
  @Post('/generateSessionId')
  async generateSessionId(): Promise<SessionId> {
    try {
      return new SessionId(await this.userInterface.generateSessionId());
    } catch (error) {
      throw new HttpException(
        'Session Id does not created',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
