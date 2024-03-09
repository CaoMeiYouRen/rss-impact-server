import RateLimit from 'express-rate-limit'
import { ErrorMessageList } from '@/constant/ErrorMessageList'
import { ResponseDto } from '@/models/ResponseDto'
/**
 * 限流器
 */
export const limiter = RateLimit({
    max: 10,
    windowMs: 1000,
    handler(req, res) { // 响应格式
        res.format({
            json() {
                res.status(429).json(new ResponseDto({
                    statusCode: 429,
                    error: 'TOO_MANY_REQUESTS',
                    message: ErrorMessageList.get(429),
                }))
            },
        })
    },
})
