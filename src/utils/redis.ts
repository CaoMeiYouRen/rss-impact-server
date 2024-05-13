import Redis from 'ioredis'
import { REDIS_URL } from '@/app.config'
import { logger } from '@/middlewares/logger.middleware'

const clients: {
    redisClient?: Redis
} = {}

export function getRedisClient() {
    if (clients.redisClient) {
        return clients.redisClient
    }
    if (!REDIS_URL) {
        throw new Error('未设置 REDIS_URL！')
    }
    clients.redisClient = new Redis(REDIS_URL)
    clients.redisClient.on('error', (error) => {
        logger.error('Redis error: ', error)
    })
    clients.redisClient.on('connect', () => {
        logger.log('Redis connected.', 'Redis')
    })
    return clients.redisClient
}
