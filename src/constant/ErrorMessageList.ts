import { HttpStatusCode } from '@/models/HttpStatusCode'
export const ErrorMessageList = new Map<HttpStatusCode, string>([
    // [200, '响应成功'],
    // [201, '创建成功'],
    [400, '数据格式有误'],
    [401, '没有权限访问'],
    [403, '该用户没有权限访问'],
    [404, '找不到要访问的接口'],
    [408, '请求超时'],
    [409, '响应超时'],
    [429, '请求次数超限'],
    [500, '服务器内部错误'],
    [502, '代理服务器错误'],
])
