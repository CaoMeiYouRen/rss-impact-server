import { applyDecorators } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

/**
 * api 的基础响应
 *
 * @author CaoMeiYouRen
 * @export
 * @returns
 */
export function ApiBaseDes() {
    return applyDecorators(
        ApiResponse({ status: 200, description: '响应成功' }),
        ApiResponse({ status: 201, description: '创建成功' }),
        ApiResponse({ status: 400, description: '数据格式有误' }),
        ApiResponse({ status: 401, description: '没有权限访问' }),
        ApiResponse({ status: 403, description: '该用户没有权限访问' }),
        ApiResponse({ status: 404, description: '找不到该接口' }),
        ApiResponse({ status: 408, description: '请求超时' }),
        ApiResponse({ status: 409, description: '请求时发生了冲突' }),
        ApiResponse({ status: 429, description: '请求次数超限' }),
        ApiResponse({ status: 500, description: '服务器内部错误' }),
        ApiResponse({ status: 502, description: '代理服务器错误' }),
    )
}
