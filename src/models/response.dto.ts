export class ResponseDto {

    constructor(obj?: ResponseDto) {
        if (obj) {
            Object.assign(this, obj)
        }
    }

    /**
     * 响应状态码
     *
     * @type {number}
     */
    statusCode?: number
    /**
     * 消息说明
     *
     * @type {string}
     */
    message?: string
    /**
     * 状态码>=400时的http status
     *
     * @type {string}
     */
    error?: string

    /**
     * 错误堆栈
     *
     * @type {string}
     */
    stack?: string
    /**
     * 返回的数据
     *
     * @type {any}
     */
    data?: any
}
