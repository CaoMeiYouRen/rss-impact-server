import { applyDecorators } from '@nestjs/common'
import { isInt, IsInt, max, Max, min, Min, ValidationOptions } from 'class-validator'
export const MAX_VALUE = Number.MAX_SAFE_INTEGER  // 2 ** 31 - 1  // 2147483647
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
 * 验证是否为安全正整数(最小值为1)
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
        Min(1, validationOptions),
        Max(maxValue, validationOptions),
    )
}

/**
 * 验证是否为安全正整数(最小值为1)
 * 函数版本
 * @author CaoMeiYouRen
 * @date 2024-03-30
 * @export
 * @param [max=Number.MAX_SAFE_INTEGER]
 * @param [validationOptions]
 */
export function isSafePositiveInteger(num: number, maxValue = Number.MAX_SAFE_INTEGER) {
    return isInt(num) && min(num, 1) && max(num, maxValue)
}

/**
 * 验证是否为安全自然数(最小值为0)
 * 装饰器版本
 * @author CaoMeiYouRen
 * @date 2024-04-11
 * @export
 * @param [maxValue=Number.MAX_SAFE_INTEGER]
 * @param [validationOptions]
 */
export function IsSafeNaturalNumber(maxValue = MAX_VALUE, validationOptions?: ValidationOptions) {
    return applyDecorators(
        IsInt(validationOptions),
        Min(0, validationOptions),
        Max(maxValue, validationOptions),
    )
}

/**
 * 验证是否为安全自然数(最小值为0)
 * 函数版本
 * @author CaoMeiYouRen
 * @date 2024-04-11
 * @export
 * @param num
 * @param [maxValue=Number.MAX_SAFE_INTEGER]
 */
export function isSafeNaturalNumber(num: number, maxValue = MAX_VALUE) {
    return isInt(num) && min(num, 0) && max(num, maxValue)
}
