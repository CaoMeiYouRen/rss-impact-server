import { applyDecorators } from '@nestjs/common'
import { IsInt, IsNumber, IsPositive, Max, Min, ValidationOptions } from 'class-validator'

/**
 * 验证是否为安全整数
 *
 * @author CaoMeiYouRen
 * @date 2024-03-30
 * @export
 * @param [validationOptions]
 */
export function IsSafeInteger(min: number = Number.MIN_SAFE_INTEGER, max: number = Number.MAX_SAFE_INTEGER, validationOptions?: ValidationOptions) {
    return applyDecorators(
        IsInt(validationOptions),
        Min(min, validationOptions),
        Max(max, validationOptions),
    )
}

/**
 * 验证是否为安全正整数
 *
 * @author CaoMeiYouRen
 * @date 2024-03-30
 * @export
 * @param [max=Number.MAX_SAFE_INTEGER]
 * @param [validationOptions]
 */
export function IsSafePositiveInteger(max: number = Number.MAX_SAFE_INTEGER, validationOptions?: ValidationOptions) {
    return applyDecorators(
        IsInt(validationOptions),
        Min(0, validationOptions),
        Max(max, validationOptions),
        IsPositive(validationOptions),
    )
}
