import { registerDecorator, ValidationOptions, ValidationArguments, isDate, isDateString } from 'class-validator'

export function IsDateOrDateString(validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string) {
        registerDecorator({
            name: 'isDateOrDateString',
            target: object?.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, _args: ValidationArguments) {
                    return isDate(value) || isDateString(value)
                },
                defaultMessage(_validationArguments?: ValidationArguments): string {
                    return 'Value must be a valid date or date string'
                },
            },
        })
    }
}
