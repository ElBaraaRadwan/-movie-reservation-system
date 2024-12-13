import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from '@nestjs/class-validator';

@ValidatorConstraint({ async: false })
export class IsCustomDateFormatConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    const regex = /^\d{4}\/\d{2}\/\d{2}-\d{2}:\d{2}(AM|PM)$/; // Regex for '2024/12/20-12:25PM'
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage(): string {
    return 'Date must be in the format YYYY/MM/DD-HH:MMAM/PM (e.g., 2024/12/20-12:25PM)';
  }
}

export function IsCustomDateFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCustomDateFormatConstraint,
    });
  };
}
