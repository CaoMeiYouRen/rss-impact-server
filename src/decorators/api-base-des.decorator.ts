import { applyDecorators } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ErrorMessageList } from '@/constant/error-message-list'

/**
 * api 的基础响应
 *
 * @author CaoMeiYouRen
 * @export
 * @returns
 */
export function ApiBaseDes() {
    return applyDecorators(
        ...[...ErrorMessageList].map(([status, description]) => ApiResponse({ status, description })),
    )
}
