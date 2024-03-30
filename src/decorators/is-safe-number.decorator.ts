import { applyDecorators } from '@nestjs/common'
import { IsNumber, IsPositive, Max, Min, ValidationOptions } from 'class-validator'

/**
 * 验证是否为安全数字
 *
 * @author CaoMeiYouRen
 * @date 2024-03-30
 * @export
 * @param [validationOptions]
 */
export function IsSafeNumber(min: number = Number.MIN_SAFE_INTEGER, max: number = Number.MAX_SAFE_INTEGER, validationOptions?: ValidationOptions) {
    return applyDecorators(
        IsNumber({ allowNaN: false, allowInfinity: false }, validationOptions),
        Min(min, validationOptions),
        Max(max, validationOptions),
    )
}

/**
 * 验证是否为安全正数
 *
 * @author CaoMeiYouRen
 * @date 2024-03-30
 * @export
 * @param [max=Number.MAX_SAFE_INTEGER]
 * @param [validationOptions]
 */
export function IsSafePositiveNumber(max: number = Number.MAX_SAFE_INTEGER, validationOptions?: ValidationOptions) {
    return applyDecorators(
        IsNumber({ allowNaN: false, allowInfinity: false }, validationOptions),
        Min(0, validationOptions),
        Max(max, validationOptions),
        IsPositive(validationOptions),
    )
}
