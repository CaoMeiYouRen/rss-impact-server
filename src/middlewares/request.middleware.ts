import { Request, Response, NextFunction } from 'express'
import { isUUID } from 'class-validator'
import { uuid } from '@/utils/helper'

export function setRequestId(req: Request, res: Response, next: NextFunction) {
    let requestId = req.header('X-Request-Id') // 先从 Request 中取
    if (!isUUID(requestId)) { // 如果不符合 uuid 规范，则生成一个 uuid 并设置
        requestId = uuid()
        req.headers['x-request-id'] = requestId
    }
    res.setHeader('X-Request-Id', requestId) // 在 Response 上设置 uuid
    next()
}
