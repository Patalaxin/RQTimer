import { Validate } from 'class-validator';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isPositive', async: false })
export class IsPositiveConstraint implements ValidatorConstraintInterface {
  validate(value: number): boolean {
    return value > 0;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must a positive number`;
  }
}

export function IsPositive() {
  return Validate(IsPositiveConstraint);
}
