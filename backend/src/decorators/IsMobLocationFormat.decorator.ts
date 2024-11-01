import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Locations, MobName } from '../schemas/mobs.enum';

@ValidatorConstraint({ async: false })
export class IsMobLocationFormatConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }
    const [mobName, location] = value.split(':').map((str) => str.trim());

    // Проверяем, что mobName и location соответствуют Enum
    return (
      Object.values(MobName).includes(mobName as MobName) &&
      Object.values(Locations).includes(location as Locations)
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'Each element in the array must be in the format "MobName: Location"';
  }
}

export function IsMobLocationFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMobLocationFormatConstraint,
    });
  };
}
