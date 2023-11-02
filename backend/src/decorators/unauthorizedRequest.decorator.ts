import { SetMetadata } from '@nestjs/common';

export const UnauthorizedRequest = () =>
  SetMetadata('unauthorizedRequest', true);
