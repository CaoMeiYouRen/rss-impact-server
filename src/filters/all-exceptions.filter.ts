import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { HttpError } from '@/models/HttpError'
import { ErrorMessageList } from '@/constant/ErrorMessageList'
import { HttpStatusCode } from '@/models/HttpStatusCode'
import { __DEV__ } from '@/app.config'
import { ResponseDto } from '@/models/ResponseDto'

/**
 * 全局异常过滤器
 *
 * @author CaoMeiYouRen
 * @date 2020-07-22
 * @export
 * @class AllExceptionsFilter
 * @implements {ExceptionFilter}
 * @template T
 */
@Catch()
export class AllExceptionsFilter<T extends Error> implements ExceptionFilter {

    private readonly logger = new Logger(AllExceptionsFilter.name)

    catch(e: T, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR // 500
        let message = '服务器内部错误'
        let stack = undefined
        if (e instanceof HttpError) {
            statusCode = e.getStatus()
            message = e.message
        } else if (e instanceof HttpException) {
            statusCode = e.getStatus()
            const res = e.getResponse()
            if (statusCode === HttpStatusCode.NOT_FOUND) { // 404
                message = e.message
            } else if (Array.isArray(res['message'])) {
                message = res['message'].join(', ')
            } else {
                message = ErrorMessageList.get(statusCode) || e.message
            }
        } else if (e instanceof Error) {
            message = e.message
        }
        if (__DEV__ && e instanceof Error) {
            stack = e.stack
            this.logger.error(message, e?.stack)
        } else if (statusCode >= HttpStatusCode.INTERNAL_SERVER_ERROR) { // 500
            this.logger.error(message, e?.stack)
        }
        response.status(statusCode)
            .json(new ResponseDto({
                statusCode,
                message,
                stack,
            }))
    }
}
