import { registerDecorator, ValidationOptions } from 'class-validator'
import { parse } from 'better-bytes'
/**
 * 是为 能通过 better-bytes parse 的安全字符串
 *
 * @author CaoMeiYouRen
 * @date 2024-05-25
 * @export
 * @param [validationOptions]
 */
export function IsBetterBytesString(validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string) {
        registerDecorator({
            name: 'isBetterBytesString',
            target: object?.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    try {
                        return parse(value) !== null
                    } catch (error) {
                        console.error(error)
                        return false
                    }
                },
                defaultMessage(): string {
                    return `${propertyName} must be a valid bytes string`
                },
            },
        })
    }
}
