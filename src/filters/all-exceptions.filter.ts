import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    Logger,
} from '@nestjs/common'
import { Response, Request } from 'express'
import { WithSentry } from '@sentry/nestjs'
import { HttpError } from '@/models/http-error'
import { ErrorMessageList } from '@/constant/error-message-list'
import { HttpStatusCode } from '@/constant/http-status-code'
import { __DEV__ } from '@/app.config'
import { ResponseDto } from '@/models/response.dto'

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

    @WithSentry()
    catch(e: T, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()
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
            this.logger.error('request.headers', request.headers)
            this.logger.error('request.body', request.body)
        } else if (statusCode >= HttpStatusCode.INTERNAL_SERVER_ERROR) { // 500
            this.logger.error(message, e?.stack)
        }
        if (!response.headersSent) {
            response.status(statusCode)
                .json(new ResponseDto({
                    statusCode,
                    message,
                    stack,
                }))
        }
    }
}
