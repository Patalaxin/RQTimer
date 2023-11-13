import { Validate } from 'class-validator';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isPositiveOrZero', async: false })
export class IsPositiveOrZeroConstraint
  implements ValidatorConstraintInterface
{
  validate(value: number, args: ValidationArguments): boolean {
    return value === 0 || value > 0;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be zero or a positive number`;
  }
}

export function IsPositiveOrZero() {
  return Validate(IsPositiveOrZeroConstraint);
}
