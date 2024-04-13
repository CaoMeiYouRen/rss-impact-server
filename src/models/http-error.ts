import { HttpException, HttpExceptionOptions } from '@nestjs/common'
import { HttpStatusCode } from '@/constant/http-status-code'
/**
 * 自定义HttpError
 *
 * @author CaoMeiYouRen
 * @export
 * @class HttpError
 * @extends {Error}
 */
export class HttpError extends HttpException {
    /**
     * statusCode 对应的 statusText
     *
     * @type {string}
     */
    error: string
    // statusCode: HttpStatusCode
    constructor(statusCode: HttpStatusCode, message: string, options?: HttpExceptionOptions) {
        super(message, statusCode, options)
        this.error = HttpStatusCode[statusCode]
    }
}
