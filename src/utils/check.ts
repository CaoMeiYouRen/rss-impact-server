import { Role } from '@/constant/role'
import { AclBase } from '@/db/models/acl-base.entity'
import { User } from '@/db/models/user.entity'

export function checkAuth(obj: AclBase, user: User) {
    if (user?.roles?.includes(Role.admin)) { // admin 无条件放行
        return true
    }
    if (!obj?.user?.id) { // obj 未设置 user
        return false
    }
    if (!user?.id) { // 没有用户不允许
        return false
    }
    return obj?.user?.id === user?.id // user 仅允许操作自己的数据
}

export function getConditions(user: User) {
    if (user?.roles?.includes(Role.admin)) { // admin 无条件放行
        return {}
    }
    return {
        user: user.id,
    }
}
