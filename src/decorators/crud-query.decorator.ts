import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { Request } from 'express'

export const CrudQuery = createParamDecorator((name, ctx: ExecutionContext) => {
    try {
        const req: Request = ctx.switchToHttp().getRequest()
        return JSON.parse(String(req.query[name] || ''))
    } catch (e) {
        return {}
    }
})
