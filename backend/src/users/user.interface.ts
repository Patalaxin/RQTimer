import { CreateUserDtoRequest } from './dto/create-user.dto';
import { User } from '../schemas/user.schema';
import {
  ChangeUserPassDtoRequest,
  ChangeUserPassDtoResponse,
} from './dto/change-user-pass.dto';
import {
  ForgotUserPassDtoRequest,
  ForgotUserPassDtoResponse,
} from './dto/forgot-user-pass.dto';
import { UpdateUnavailableDto } from './dto/update-unavailable.dto';
import { UpdateExcludedDto } from './dto/update-excluded.dto';
import {
  UpdateUserRoleDtoRequest,
  UpdateUserRoleDtoResponse,
} from './dto/update-user-role.dto';
import {
  DeleteAllUsersDtoResponse,
  DeleteUserDtoResponse,
} from './dto/delete-user.dto';
import { FindAllUsersDtoResponse } from './dto/findAll-user.dto';

export interface IUser {
  createUser(createUserDto: CreateUserDtoRequest): Promise<User>;

  findUser(nicknameOrEmail: string): Promise<User>;

  findAll(): Promise<FindAllUsersDtoResponse[]>;

  changePassword(
    email: string,
    updateUserPassDto: ChangeUserPassDtoRequest,
  ): Promise<ChangeUserPassDtoResponse>;

  forgotPassword(
    forgotUserPassDto: ForgotUserPassDtoRequest,
  ): Promise<ForgotUserPassDtoResponse>;

  updateUnavailable(updateUnavailableDto: UpdateUnavailableDto): Promise<User>;

  updateExcluded(
    email: string,
    updateExcludedDto: UpdateExcludedDto,
  ): Promise<User>;

  updateRole(
    updateUserRoleDto: UpdateUserRoleDtoRequest,
  ): Promise<UpdateUserRoleDtoResponse>;

  deleteOne(identifier: string): Promise<DeleteUserDtoResponse>;

  deleteAll(): Promise<DeleteAllUsersDtoResponse>;
}
