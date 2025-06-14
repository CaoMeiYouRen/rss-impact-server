import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

/**
 * 校验 JSON.stringify 后的字符串长度是否在指定范围内
 *
 * @author CaoMeiYouRen
 * @date 2024-03-23
 * @export
 * @param [min]
 * @param [max]
 * @param [validationOptions]
 */
export function JsonStringLength(min?: number, max?: number, validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string) {
        registerDecorator({
            name: 'jsonStringLength',
            target: object?.constructor,
            propertyName,
            constraints: [min, max],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedMin, relatedMax] = args.constraints || []
                    const stringifiedValue = JSON.stringify(value)
                    if (typeof stringifiedValue !== 'string') {
                        return false
                    }
                    const length = stringifiedValue.length
                    if (
                        relatedMin !== undefined && length < relatedMin ||
                        relatedMax !== undefined && length > relatedMax
                    ) {
                        return false
                    }
                    return true
                },
                defaultMessage(validationArguments?: ValidationArguments): string {
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    const [min, max] = validationArguments?.constraints || []
                    return `JSON string length must be between ${min || 0} and ${max || 'unlimited'}`
                },
            },
        })
    }
}
