import { SetMetadata } from '@nestjs/common';
import { RolesTypes } from '../schemas/user.schema';

export const Roles = (...args: RolesTypes[]) => SetMetadata('roles', args);
