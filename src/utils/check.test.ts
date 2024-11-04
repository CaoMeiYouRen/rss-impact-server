import { Like, Between } from 'typeorm'
import { checkAuth, getConditions } from './check'
import { Role } from '@/constant/role'
import { AclBase } from '@/db/models/acl-base.entity'
import { User } from '@/db/models/user.entity'

describe('checkAuth', () => {
    it('should return true for admin user', () => {
        const user = { roles: [Role.admin] } as User
        const obj = {} as AclBase
        expect(checkAuth(obj, user)).toBe(true)
    })

    it('should return false if obj has no user set', () => {
        const user = { id: 1 } as User
        const obj = {} as AclBase
        expect(checkAuth(obj, user)).toBe(false)
    })

    it('should return false if user is not provided', () => {
        const obj = { user: { id: 1 } } as AclBase
        expect(checkAuth(obj, undefined)).toBe(false)
    })

    it('should return true if user matches obj.user', () => {
        const user = { id: 1 } as User
        const obj = { user: { id: 1 } } as AclBase
        expect(checkAuth(obj, user)).toBe(true)
    })

    it('should return false if user does not match obj.user', () => {
        const user = { id: 2 } as User
        const obj = { user: { id: 1 } } as AclBase
        expect(checkAuth(obj, user)).toBe(false)
    })
})

describe('getConditions', () => {
    const mockUserAdmin = {
        id: 1,
        roles: ['admin'],
    } as User

    const mockUserNonAdmin = {
        id: 2,
        roles: ['user'],
    } as User

    const mockWhere = {
        name: { $op: 'Like', value: 'John' },
        age: { $op: 'Between', value: [18, 30] },
    }

    it('should return only the where conditions if user is admin', () => {
        const result = getConditions(mockUserAdmin, mockWhere)
        expect(result).toEqual({
            name: Like('John'),
            age: Between(18, 30),
        })
    })

    it('should return where conditions with userId if user is not admin', () => {
        const result = getConditions(mockUserNonAdmin, mockWhere)
        expect(result).toEqual({
            name: Like('John'),
            age: Between(18, 30),
            userId: 2,
        })
    })

    it('should return empty object if where is not provided', () => {
        const resultAdmin = getConditions(mockUserAdmin)
        expect(resultAdmin).toEqual({})

        const resultNonAdmin = getConditions(mockUserNonAdmin)
        expect(resultNonAdmin).toEqual({ userId: 2 })
    })

    it('should handle basic types correctly', () => {
        const mockWhereBasicTypes = {
            name: 'John',
            age: 25,
            isActive: true,
        }

        const resultAdmin = getConditions(mockUserAdmin, mockWhereBasicTypes)
        expect(resultAdmin).toEqual(mockWhereBasicTypes)

        const resultNonAdmin = getConditions(mockUserNonAdmin, mockWhereBasicTypes)
        expect(resultNonAdmin).toEqual({
            ...mockWhereBasicTypes,
            userId: 2,
        })
    })

    it('should handle unknown operators correctly', () => {
        const mockWhereUnknownOp = {
            name: { $op: 'UnknownOp', value: 'John' },
        }

        const resultAdmin = getConditions(mockUserAdmin, mockWhereUnknownOp)
        expect(resultAdmin).toEqual(mockWhereUnknownOp)

        const resultNonAdmin = getConditions(mockUserNonAdmin, mockWhereUnknownOp)
        expect(resultNonAdmin).toEqual({
            ...mockWhereUnknownOp,
            userId: 2,
        })
    })
})
