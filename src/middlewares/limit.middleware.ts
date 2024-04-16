import RateLimit from 'express-rate-limit'
import { ErrorMessageList } from '@/constant/error-message-list'
import { ResponseDto } from '@/models/response.dto'
/**
 * 限流器
 */
export const limiter = RateLimit({
    // TODO redis store 支持
    max: 20,
    windowMs: 1000,
    validate: {
        trustProxy: false, // 解决 ERR_ERL_PERMISSIVE_TRUST_PROXY 代理不可信问题
    },
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
