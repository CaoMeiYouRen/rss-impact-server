import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import { Reflector } from '@nestjs/core'
import _ from 'lodash'
import { User } from '@/db/models/user.entity'
import { HttpError } from '@/models/http-error'
import { HttpStatusCode } from '@/constant/http-status-code'

/**
 * 角色守卫路由
 *
 * @author CaoMeiYouRen
 * @export
 * @class RolesGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {

    constructor(private reflector: Reflector) { }
    canActivate(
        context: ExecutionContext,
    ) {
        const roles = this.reflector.getAllAndOverride<string[]>('roles', [context.getHandler(), context.getClass()])
        if (!roles?.length) { // 如果没有标记 roles 直接放行
            return true
        }
        const req = context.switchToHttp().getRequest<Request>()
        const user = req.user as User
        const result = _.intersection(roles, user.roles)// 求 roles 的交集
        if (result.length <= 0) {
            throw new HttpError(HttpStatusCode.FORBIDDEN, '当前用户无权限访问该接口！')
        }
        return result.length > 0
    }

}
