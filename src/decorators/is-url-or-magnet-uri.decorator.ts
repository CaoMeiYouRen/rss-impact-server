import { registerDecorator, ValidationOptions, isURL, isMagnetURI } from 'class-validator'
import { IsURLOptions } from 'validator'
import { __PROD__ } from '@/app.config'

export function IsUrlOrMagnetUri(validationOptions?: ValidationOptions, isUrlOptions?: IsURLOptions) {
    return function (object: unknown, propertyName: string) {
        registerDecorator({
            name: 'isUrlOrMagnetUri',
            target: object?.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return isURL(value, {
                        require_tld: __PROD__, // 是否要顶级域名
                        ...isUrlOptions,
                    }) || isMagnetURI(value)
                },
                defaultMessage(): string {
                    return `${propertyName} must be a valid URL or Magnet URI`
                },
            },
        })
    }
}
