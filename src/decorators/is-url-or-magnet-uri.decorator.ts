import { registerDecorator, ValidationOptions, isURL, isMagnetURI } from 'class-validator'

export function IsUrlOrMagnetUri(validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string) {
        registerDecorator({
            name: 'isUrlOrMagnetUri',
            target: object?.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return isURL(value) || isMagnetURI(value)
                },
                defaultMessage(): string {
                    return 'Value must be a valid URL or Magnet URI'
                },
            },
        })
    }
}
