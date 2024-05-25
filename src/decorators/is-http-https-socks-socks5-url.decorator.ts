import { registerDecorator, ValidationOptions, isURL } from 'class-validator'
import { IsURLOptions } from 'validator'
import { isSocksUrl } from '@/utils/helper'

export function IsHttpHttpsSocksSocks5Url(validationOptions?: ValidationOptions, isUrlOptions?: IsURLOptions) {
    return function (object: unknown, propertyName: string) {
        registerDecorator({
            name: 'isHttpHttpsSocksSocks5Url',
            target: object?.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    const url = new URL(value)
                    const protocol = url.protocol.toLowerCase()
                    const allowedProtocols = ['http:', 'https:', 'socks:', 'socks5:']
                    return allowedProtocols.includes(protocol) && (isURL(value, isUrlOptions) || isSocksUrl(value))
                },
                defaultMessage(): string {
                    return `${propertyName} must be a valid URL with http, https, socks or socks5 protocol`
                },
            },
        })
    }
}
