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
import { UsersGuard } from '../guards/users.guard';
import { GetEmailFromToken } from '../decorators/getEmail.decorator';
import { Roles } from '../decorators/roles.decorator';
import {
  DeleteAllUsersDtoResponse,
  DeleteUserDtoResponse,
} from './dto/delete-user.dto';
import { IUser } from '../domain/user/user.interface';

@ApiTags('User API')
@UseGuards(RolesGuard)
@Controller('user')
export class UsersController {
  constructor(@Inject('IUser') private readonly userInterface: IUser) {}

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create User' })
  @Post('/create')
  async create(@Body() createUserDto: CreateUserDtoRequest): Promise<User> {
    return new User(await this.userInterface.createUser(createUserDto));
  }

  @UseGuards(UsersGuard)
  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get User By Email' })
  @Get('findUser')
  async getOne(@GetEmailFromToken() email: string): Promise<User> {
    return new User(await this.userInterface.findUser(email));
  }

  @UseGuards(UsersGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find All Users' })
  @Get('/findAll')
  async findAll(): Promise<User[]> {
    return await this.userInterface.findAll();
  }

  @UseGuards(UsersGuard)
  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change User Password' })
  @ApiOkResponse({ description: 'Success', type: ChangeUserPassDtoResponse })
  @Put('/changePassword')
  async changePassword(
    @GetEmailFromToken() email: string,
    @Body() updateUserPassDto: ChangeUserPassDtoRequest,
  ): Promise<ChangeUserPassDtoResponse> {
    return this.userInterface.changePassword(email, updateUserPassDto);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Forgot User Password' })
  @ApiOkResponse({ description: 'Success', type: ForgotUserPassDtoResponse })
  @Put('/forgotPassword')
  async forgotPassword(
    @Body() forgotUserPassDto: ForgotUserPassDtoRequest,
  ): Promise<ForgotUserPassDtoResponse> {
    return this.userInterface.forgotPassword(forgotUserPassDto);
  }

  @UseGuards(UsersGuard)
  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
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

  @UseGuards(UsersGuard)
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

  @UseGuards(UsersGuard)
  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update The User Role' })
  @ApiOkResponse({ description: 'Success', type: UpdateUserRoleDtoResponse })
  @Put('/updateRole')
  async updateRole(
    @Body() updateUserRoleDto: UpdateUserRoleDtoRequest,
  ): Promise<UpdateUserRoleDtoResponse> {
    return await this.userInterface.updateRole(updateUserRoleDto);
  }

  @UseGuards(UsersGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete User By Email' })
  @ApiOkResponse({ description: 'Success', type: DeleteUserDtoResponse })
  @Delete(':email')
  async deleteOne(
    @Param('email') email: string,
  ): Promise<DeleteUserDtoResponse> {
    return await this.userInterface.deleteOne(email);
  }

  @UseGuards(UsersGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete All Users' })
  @ApiOkResponse({ description: 'Success', type: DeleteAllUsersDtoResponse })
  @Delete('/deleteAll')
  async deleteAll(): Promise<DeleteAllUsersDtoResponse> {
    return await this.userInterface.deleteAll();
  }

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
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
