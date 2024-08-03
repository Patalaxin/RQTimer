import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsNicknameConstraint implements ValidatorConstraintInterface {
  validate(nickname: any) {
    const regex = /^[a-zA-Zа-яА-Я]{4,64}$/;
    return typeof nickname === 'string' && regex.test(nickname);
  }

  defaultMessage() {
    return 'Nickname must be between 4 and 64 characters long and contain only Russian or Latin letters without special characters.';
  }
}

export function IsNickname(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNicknameConstraint,
    });
  };
}
