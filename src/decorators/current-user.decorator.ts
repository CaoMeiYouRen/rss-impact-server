import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import { User } from '@/db/models/user.entity'

/**
 * 获取当前登录的用户
 */
export const CurrentUser = createParamDecorator((data, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest()
    const user = req.user as User
    if (user?.password) {
        delete user.password
    }
    return user || {
        id: 0,
        username: '',
        email: '',
        roles: [],
    } as User
})
