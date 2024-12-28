import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsISO8601DateFormatConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    const regex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?$/; // Regex for ISO-8601 DateTime format
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage(): string {
    return 'Date must be in the ISO-8601 format (e.g., 2024-12-20T12:25:00Z)';
  }
}

export function IsDateFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsISO8601DateFormatConstraint,
    });
  };
}

@ValidatorConstraint({ async: false })
export class IsLocationFormatConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    const regex = /^[A-Za-z\s]+,\s[A-Za-z\s]+$/; // Regex for "City, Venue" format
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage(): string {
    return 'Location must follow the format "City, Venue" (e.g., "New York, Madison Square Garden")';
  }
}

export function IsLocationFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLocationFormatConstraint,
    });
  };
}
