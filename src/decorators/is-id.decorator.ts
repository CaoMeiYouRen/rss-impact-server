import { applyDecorators } from '@nestjs/common'
import { isInt, IsInt, max, Max, min, Min, ValidationOptions } from 'class-validator'
import { IS_ID } from '@/constant/decorator'

// 9007199254740991 2 ** 53 − 1.
// 2147483647 2 ** 31 - 1
export const MAX_ID = Number.MAX_SAFE_INTEGER

/**
 * 验证是否为整数 ID （integer 类型）。
 * 装饰器版本
 * @author CaoMeiYouRen
 * @date 2024-03-20
 * @export
 */
export function IsId(validationOptions?: ValidationOptions) {
    return applyDecorators(
        (target: object, propertyKey: string | symbol) => Reflect.defineMetadata(IS_ID, true, target, propertyKey),
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
