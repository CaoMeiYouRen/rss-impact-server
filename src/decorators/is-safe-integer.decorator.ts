import { applyDecorators } from '@nestjs/common'
import { isInt, IsInt, max, Max, min, Min, ValidationOptions } from 'class-validator'

/**
 * 验证是否为安全整数
 *
 * @author CaoMeiYouRen
 * @date 2024-03-30
 * @export
 * @param [validationOptions]
 */
export function IsSafeInteger(minValue = Number.MIN_SAFE_INTEGER, maxValue = Number.MAX_SAFE_INTEGER, validationOptions?: ValidationOptions) {
    return applyDecorators(
        IsInt(validationOptions),
        Min(minValue, validationOptions),
        Max(maxValue, validationOptions),
    )
}

/**
 * 验证是否为安全正整数(最小值为0)
 * 装饰器版本
 * @author CaoMeiYouRen
 * @date 2024-03-30
 * @export
 * @param [max=Number.MAX_SAFE_INTEGER]
 * @param [validationOptions]
 */
export function IsSafePositiveInteger(maxValue = Number.MAX_SAFE_INTEGER, validationOptions?: ValidationOptions) {
    return applyDecorators(
        IsInt(validationOptions),
        Min(0, validationOptions),
        Max(maxValue, validationOptions),
        // IsPositive(validationOptions),
    )
}

/**
 * 验证是否为安全正整数(最小值为0)
 * 函数版本
 * @author CaoMeiYouRen
 * @date 2024-03-30
 * @export
 * @param [max=Number.MAX_SAFE_INTEGER]
 * @param [validationOptions]
 */
export function isSafePositiveInteger(num: number, maxValue = Number.MAX_SAFE_INTEGER) {
    return isInt(num) && min(num, 0) && max(num, maxValue) // && isPositive(num)
}
