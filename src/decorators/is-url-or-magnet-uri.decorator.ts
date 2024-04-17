import { registerDecorator, ValidationOptions, isURL, isMagnetURI, ValidationArguments } from 'class-validator'
import { IsURLOptions } from 'validator'

export function IsUrlOrMagnetUri(validationOptions?: ValidationOptions, isUrlOptions?: IsURLOptions) {
    return function (object: unknown, propertyName: string) {
        registerDecorator({
            name: 'isUrlOrMagnetUri',
            target: object?.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, _validationArguments?: ValidationArguments) {
                    return isURL(value, isUrlOptions) || isMagnetURI(value)
                },
                defaultMessage(): string {
                    return 'Value must be a valid URL or Magnet URI'
                },
            },
        })
    }
}
