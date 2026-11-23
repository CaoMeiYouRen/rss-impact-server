import { Logger } from '@nestjs/common'
import { OIDCUserService } from './oidc-user.service'
import { User } from '@/db/models/user.entity'

interface TestSession {
    uid?: number
    save: jest.Mock
}

function createSession(): TestSession {
    return {
        uid: undefined,
        save: jest.fn((callback?: (err?: unknown) => void) => callback?.()),
    }
}

function createService(options: { users?: User[] } = {}) {
    const users = options.users ?? []
    const repository = {
        findOne: jest.fn(async ({ where }: { where: Partial<User> }) => {
            if (where.auth0Id !== undefined) {
                return users.find((user) => user.auth0Id === where.auth0Id) ?? null
            }
            if (where.email !== undefined) {
                return users.find((user) => user.email === where.email) ?? null
            }
            // 模拟 TypeORM 默认忽略 undefined 条件后的空 where 行为。
            // 正常情况下执行不到这里；测试用它证明修复前会绑定首个用户。
            return users[0] ?? null
        }),
        save: jest.fn(async (user: User) => user),
        create: jest.fn((user: Partial<User>) => user as User),
    }
    const service = new OIDCUserService(repository as any)
    return { service, repository }
}

function createUser(overrides: Partial<User> = {}): User {
    return {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        emailVerified: true,
        roles: ['admin'],
        auth0Id: null,
        ...overrides,
    } as User
}

async function login(
    service: OIDCUserService,
    payload: Record<string, unknown>,
    session: TestSession,
) {
    return service.login(payload as any, session as any)
}

describe('OIDCUserService.login', () => {
    beforeEach(() => {
        jest.spyOn(Logger.prototype, 'warn').mockImplementation()
        jest.spyOn(Logger.prototype, 'log').mockImplementation()
        jest.spyOn(Logger.prototype, 'debug').mockImplementation()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('已绑定的 sub 应直接登录', async () => {
        const user = createUser({ auth0Id: 'auth0|victim' })
        const { service, repository } = createService({ users: [user] })
        const session = createSession()

        await login(service, {
            sub: 'auth0|victim',
            email: 'admin@example.com',
            email_verified: true,
        }, session)

        expect(session.uid).toBe(user.id)
        expect(session.save).toHaveBeenCalled()
        expect(repository.save).toHaveBeenCalled()
    })

    it('未验证邮箱不能绑定已有账号', async () => {
        const user = createUser({ auth0Id: null })
        const { service, repository } = createService({ users: [user] })
        const session = createSession()

        await expect(login(service, {
            sub: 'auth0|attacker',
            email: 'admin@example.com',
            email_verified: false,
        }, session)).rejects.toMatchObject({ status: 403 })

        expect(repository.save).not.toHaveBeenCalled()
        expect(session.uid).toBeUndefined()
    })

    it('未知 sub 且缺少 email 时应拒绝，且不执行 email 查询', async () => {
        const { service, repository } = createService({ users: [createUser()] })
        const session = createSession()

        await expect(login(service, {
            sub: 'auth0|attacker',
            email_verified: false,
        }, session)).rejects.toMatchObject({ status: 400 })

        expect(repository.findOne).toHaveBeenCalledTimes(1)
        expect(repository.findOne).toHaveBeenCalledWith({ where: { auth0Id: 'auth0|attacker' } })
        expect(repository.save).not.toHaveBeenCalled()
        expect(session.uid).toBeUndefined()
    })

    it('已验证邮箱可以绑定未绑定 auth0Id 的已有账号', async () => {
        const user = createUser({ auth0Id: null })
        const { service, repository } = createService({ users: [user] })
        const session = createSession()

        await login(service, {
            sub: 'auth0|attacker',
            email: 'admin@example.com',
            email_verified: true,
        }, session)

        expect(user.auth0Id).toBe('auth0|attacker')
        expect(user.emailVerified).toBe(true)
        expect(repository.save).toHaveBeenCalledWith(user)
        expect(session.uid).toBe(user.id)
        expect(session.save).toHaveBeenCalled()
    })

    it('已验证邮箱也不能覆盖其他 auth0Id 绑定', async () => {
        const user = createUser({ auth0Id: 'auth0|legit' })
        const { service, repository } = createService({ users: [user] })
        const session = createSession()

        await expect(login(service, {
            sub: 'auth0|attacker',
            email: 'admin@example.com',
            email_verified: true,
        }, session)).rejects.toMatchObject({ status: 409 })

        expect(user.auth0Id).toBe('auth0|legit')
        expect(repository.save).not.toHaveBeenCalled()
        expect(session.uid).toBeUndefined()
    })

    it('已绑定 sub 的邮箱与其他账号冲突时应拒绝同步', async () => {
        const boundUser = createUser({ id: 1, auth0Id: 'auth0|victim', email: 'old@example.com' })
        const otherUser = createUser({ id: 2, email: 'admin@example.com', auth0Id: null })
        const { service, repository } = createService({ users: [boundUser, otherUser] })
        const session = createSession()

        await expect(login(service, {
            sub: 'auth0|victim',
            email: 'admin@example.com',
            email_verified: true,
        }, session)).rejects.toMatchObject({ status: 409 })

        expect(repository.save).not.toHaveBeenCalled()
        expect(session.uid).toBeUndefined()
    })

    it('关闭注册时未知 sub + 新邮箱应拒绝', async () => {
        const { service, repository } = createService({ users: [] })
        const session = createSession()

        await expect(login(service, {
            sub: 'auth0|new-user',
            email: 'new@example.com',
            email_verified: true,
        }, session)).rejects.toMatchObject({ status: 400 })

        expect(repository.save).not.toHaveBeenCalled()
        expect(session.uid).toBeUndefined()
    })

    it('已绑定 sub 缺少 email_verified 时不应降级已有验证状态', async () => {
        const user = createUser({ auth0Id: 'auth0|victim', emailVerified: true })
        const { service } = createService({ users: [user] })
        const session = createSession()

        await login(service, {
            sub: 'auth0|victim',
            email: 'admin@example.com',
        }, session)

        expect(user.emailVerified).toBe(true)
        expect(session.uid).toBe(user.id)
    })
})
