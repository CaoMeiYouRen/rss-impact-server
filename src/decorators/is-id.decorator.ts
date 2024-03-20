import { applyDecorators } from '@nestjs/common'
import { isInt, IsInt, max, Max, min, Min } from 'class-validator'

/**
 * 验证是否为整数 ID （integer 类型）。
 * 装饰器版本
 * @author CaoMeiYouRen
 * @date 2024-03-20
 * @export
 */
export function IsId() {
    return applyDecorators(
        IsInt(),
        Min(1),
        Max(Number.MAX_SAFE_INTEGER),
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
    return isInt(id) && min(id, 1) && max(id, Number.MAX_SAFE_INTEGER)
}
