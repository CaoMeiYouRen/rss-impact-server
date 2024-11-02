export enum Role {
    user = 'user',
    admin = 'admin',
    demo = 'demo', // demo 账号用于演示，有正常用户的权限，但是不能修改用户信息
}

export type RoleType = 'user' | 'admin' | 'demo'

