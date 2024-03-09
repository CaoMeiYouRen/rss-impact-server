import { HttpException } from '@nestjs/common'
import { HttpStatusCode } from './HttpStatusCode'
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
    constructor(statusCode: HttpStatusCode, message: string) {
        super(message, statusCode)
        this.error = HttpStatusCode[statusCode]
    }
}
