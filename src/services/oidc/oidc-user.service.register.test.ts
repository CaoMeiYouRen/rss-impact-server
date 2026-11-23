import { Logger } from '@nestjs/common'

jest.mock('@/app.config', () => ({
    ENABLE_REGISTER: true,
    ALLOWED_EMAIL_DOMAINS: [],
    TZ: 'Asia/Shanghai',
}))

import { OIDCUserService } from './oidc-user.service'
import { User } from '@/db/models/user.entity'

describe('OIDCUserService.login - 注册开启', () => {
    beforeEach(() => {
        jest.spyOn(Logger.prototype, 'warn').mockImplementation()
        jest.spyOn(Logger.prototype, 'log').mockImplementation()
        jest.spyOn(Logger.prototype, 'debug').mockImplementation()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('未知 sub + 新邮箱应创建新用户并登录', async () => {
        const repository = {
            findOne: jest.fn().mockResolvedValue(null),
            save: jest.fn(async (user: User) => ({ id: 9, ...user })),
            create: jest.fn((user: Partial<User>) => user as User),
        }
        const service = new OIDCUserService(repository as any)
        const session = {
            uid: undefined,
            save: jest.fn((callback?: (err?: unknown) => void) => callback?.()),
        }

        const user = await service.login({
            sub: 'auth0|new-user',
            email: 'new@example.com',
            email_verified: false,
            nickname: 'new-user',
        } as any, session as any)

        expect(user.id).toBe(9)
        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
            auth0Id: 'auth0|new-user',
            email: 'new@example.com',
            emailVerified: false,
            roles: ['user'],
            disablePasswordLogin: true,
        }))
        expect(session.uid).toBe(9)
        expect(session.save).toHaveBeenCalled()
    })
})
