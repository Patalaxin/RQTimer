import { SetMetadata } from '@nestjs/common';
import { RolesTypes } from '../schemas/roles.enum';

export const Roles = (...args: RolesTypes[]) => SetMetadata('roles', args);
