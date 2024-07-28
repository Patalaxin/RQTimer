import { CreateUserDtoRequest } from '../../users/dto/create-user.dto';
import { User } from '../../schemas/user.schema';
import {
  ChangeUserPassDtoRequest,
  ChangeUserPassDtoResponse,
} from '../../users/dto/change-user-pass.dto';
import {
  ForgotUserPassDtoRequest,
  ForgotUserPassDtoResponse,
} from '../../users/dto/forgot-user-pass.dto';
import { UpdateUnavailableDto } from '../../users/dto/update-unavailable.dto';
import { UpdateExcludedDto } from '../../users/dto/update-excluded.dto';
import {
  UpdateUserRoleDtoRequest,
  UpdateUserRoleDtoResponse,
} from '../../users/dto/update-user-role.dto';
import {
  DeleteAllUsersDtoResponse,
  DeleteUserDtoRequest,
  DeleteUserDtoResponse,
} from '../../users/dto/delete-user.dto';
import { SessionId } from '../../schemas/sessionID.schema';

export interface IUser {
  createUser(createUserDto: CreateUserDtoRequest): Promise<User>;

  findUser(nicknameOrEmail: string): Promise<User>;

  findAll(): Promise<User[]>;

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

  deleteOne(
    deleteUserDtoRequest: DeleteUserDtoRequest,
  ): Promise<DeleteUserDtoResponse>;

  deleteAll(): Promise<DeleteAllUsersDtoResponse>;

  generateSessionId(): Promise<SessionId>;
}
