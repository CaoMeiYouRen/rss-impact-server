import RateLimit, { LegacyStore, Store } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import ms from 'ms'
import { ErrorMessageList } from '@/constant/error-message-list'
import { ResponseDto } from '@/models/response.dto'
import { __DEV__, REDIS_URL } from '@/app.config'
import { getRedisClient } from '@/utils/redis'

let store: Store | LegacyStore
if (REDIS_URL) {
    const client = getRedisClient()
    store = new RedisStore({
        prefix: 'rss-impact:',
        // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
        sendCommand: (...args: string[]) => client.call(...args),
    })
}
/**
 * 限流器
 */
export const limiter = RateLimit({
    store,
    max: __DEV__ ? 10000 : 500,
    windowMs: ms('1m'), // 1 分钟时间
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
