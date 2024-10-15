export interface JwtPayload {
    // 昵称
    nickname: string
    // 用户名
    name: string
    // 头像
    picture: string
    // 更新时间
    updated_at: Date
    // 邮箱
    email: string
    // 邮箱是否已验证
    email_verified: boolean

    iss: string
    aud: string
    iat: number
    exp: number
    // 用户id 格式为 xxxx|yyyy
    sub: string
    // session id
    sid: string
    nonce: string
}
