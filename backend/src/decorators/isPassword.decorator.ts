import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsPassword(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'isPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          const regex: RegExp = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,64}$/;

          return regex.test(value);
        },
        defaultMessage: (): string =>
          'The password must contain from 6 to 64 characters, must include 1 letters (at least 1 uppercase and one lowercase) and numbers !',
      },
    });
  };
}
