import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '@/db/models/user.entity'
import { Role } from '@/constant/role'
import { HttpError } from '@/models/http-error'
import { JwtPayload } from '@/interfaces/auth0'
import { ISession } from '@/interfaces/session'
import { ENABLE_REGISTER } from '@/app.config'
import { getAccessToken, getRandomCode } from '@/utils/helper'

/**
 * 处理 OIDC 用户信息到本地用户的映射。
 *
 * 安全约束：
 * 1. 未知 sub 必须携带 email，避免 TypeORM 忽略 undefined 条件后绑定到首个用户；
 * 2. 只有 IdP 明确声明 email_verified === true 时，才允许按邮箱关联已有账号；
 * 3. 已绑定其他 auth0Id 的账号不允许被覆盖绑定。
 */
@Injectable()
export class OIDCUserService {

    private readonly logger = new Logger(OIDCUserService.name)

    constructor(
        @InjectRepository(User) private readonly repository: Repository<User>,
    ) { }

    /**
     * 校验 OIDC claims 并解析出本地用户，不修改会话。
     */
    async resolve(payload: JwtPayload): Promise<User> {
        this.logger.debug({ sub: payload?.sub }, 'OIDC payload')
        // nickname 比 name 更友好，更接近用户设定的用户名
        const { sub: auth0Id, email: rawEmail, email_verified, nickname, picture, name } = payload
        const email = typeof rawEmail === 'string' ? rawEmail.trim() : rawEmail
        const username = nickname || name || email?.split('@')[0] || 'user'

        if (typeof auth0Id !== 'string' || !auth0Id) {
            throw new HttpError(400, 'OIDC 用户信息缺少 sub')
        }

        // 检查该 sub 是否已经被绑定
        let user = await this.repository.findOne({ where: { auth0Id } })
        // 如果该 sub 已经被绑定，则同步用户信息
        if (user) {
            // 只同步 IdP 已验证的邮箱，且不能与其他账号冲突
            if (typeof email === 'string' && email && email_verified === true && email !== user.email) {
                const conflict = await this.repository.findOne({ where: { email } })
                if (conflict && conflict.id !== user.id) {
                    throw new HttpError(409, '该邮箱已被其他账号使用')
                }
                user.email = email
            }
            if (email_verified !== undefined) {
                user.emailVerified = email_verified === true
            }
            user.avatar = picture
            user = await this.repository.save(user)
            return user
        }

        // 未知 sub 必须携带 email，否则后续查库会因条件被忽略而命中首个用户
        if (typeof email !== 'string' || !email) {
            throw new HttpError(400, 'OIDC 用户信息缺少 email')
        }

        // 如果该邮箱已经被注册，则只有在邮箱已验证时才允许关联
        user = await this.repository.findOne({ where: { email } })
        if (user) {
            if (email_verified !== true) {
                this.logger.warn(`拒绝未验证邮箱的 OIDC 绑定: userId=${user.id}`)
                throw new HttpError(403, '无法完成 OIDC 登录，请先验证邮箱或使用原账号登录')
            }
            if (user.auth0Id !== null && user.auth0Id !== undefined && user.auth0Id !== auth0Id) {
                this.logger.warn(`拒绝覆盖已绑定的 OIDC 账号: userId=${user.id}`)
                throw new HttpError(409, '该账号已绑定其他第三方身份')
            }
            user.auth0Id = auth0Id
            user.emailVerified = true
            user.avatar = picture
            user = await this.repository.save(user)
            this.logger.log(`OIDC 账号绑定成功: userId=${user.id}`)
            return user
        }
        if (!ENABLE_REGISTER) {
            throw new HttpError(400, '当前不允许注册新用户！')
        }
        // 如果邮箱未注册，则创建新用户
        user = await this.repository.save(this.repository.create({
            username,
            auth0Id,
            email,
            emailVerified: email_verified === true,
            avatar: picture,
            roles: [Role.user],
            accessToken: getAccessToken('rss-impact'),
            password: getRandomCode(32), // 生成随机密码
            disablePasswordLogin: true, // 不允许密码登录
        }))
        return user
    }

    /**
     * 写入登录会话并持久化。
     */
    async attachSession(user: User, session: ISession): Promise<User> {
        session.uid = user.id
        await new Promise<void>((resolve, reject) => {
            session.save((err) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve()
            })
        })
        return user
    }

    /**
     * 校验 OIDC claims 并完成本地登录。
     */
    async login(payload: JwtPayload, session: ISession): Promise<User> {
        const user = await this.resolve(payload)
        return this.attachSession(user, session)
    }

}
