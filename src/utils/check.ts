import { transformQueryOperator } from './helper'
import { Role } from '@/constant/role'
import { AclBase } from '@/db/models/acl-base.entity'
import { User } from '@/db/models/user.entity'

export function checkAuth(obj: AclBase, user: User) {
    if (user?.roles?.includes(Role.admin)) { // admin 无条件放行
        return true
    }
    const objUserId = obj?.user?.id || obj?.userId
    const userId = user?.id
    if (!objUserId) { // obj 未设置 user
        return false
    }
    if (!userId) { // 没有用户不允许
        return false
    }
    return objUserId === userId // user 仅允许操作自己的数据
}
// 生成查询条件
export function getConditions(user: User, where: Record<string, any> = {}) {
    if (user?.roles?.includes(Role.admin)) { // admin 无条件放行
        return {
            ...transformQueryOperator(where),
        }
    }
    return {
        ...transformQueryOperator(where),
        userId: user.id,
    }
}
