import { applyDecorators } from '@nestjs/common'
import { isInt, IsInt, max, Max, min, Min, ValidationOptions } from 'class-validator'

// Number.MAX_SAFE_INTEGER
export const MAX_ID = 2147483647 // 2 ** 31 - 1

/**
 * 验证是否为整数 ID （integer 类型）。
 * 装饰器版本
 * @author CaoMeiYouRen
 * @date 2024-03-20
 * @export
 */
export function IsId(validationOptions?: ValidationOptions) {
    return applyDecorators(
        IsInt(validationOptions),
        Min(1, validationOptions),
        Max(MAX_ID, validationOptions),
    )
}

/**
 * 验证是否为整数 ID （integer 类型）。
 * 函数版本
 * @author CaoMeiYouRen
 * @date 2024-03-20
 * @export
 * @param id
 */
export function isId(id: unknown) {
    return isInt(id) && min(id, 1) && max(id, MAX_ID)
}
