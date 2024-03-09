import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { throwError, TimeoutError, catchError, timeout } from 'rxjs'
import { TIMEOUT } from '@/app.config'
import { HttpError } from '@/models/HttpError'
import { HttpStatusCode } from '@/models/HttpStatusCode'

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        return next.handle().pipe(
            timeout(TIMEOUT),
            catchError((err) => {
                if (err instanceof TimeoutError) {
                    return throwError(() => new HttpError(HttpStatusCode.REQUEST_TIMEOUT, '请求超时'))
                }
                return throwError(() => err)
            }),
        )
    }
}
