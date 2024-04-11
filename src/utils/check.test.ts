import { Role } from '@/constant/role';
import { AclBase } from '@/db/models/acl-base.entity';
import { User } from '@/db/models/user.entity';
import { checkAuth, getConditions } from './check';

describe('checkAuth', () => {
    it('should return true for admin user', () => {
        const user = { roles: [Role.admin] } as User;
        const obj = {} as AclBase;
        expect(checkAuth(obj, user)).toBe(true);
    });

    it('should return false if obj has no user set', () => {
        const user = { id: 1 } as User;
        const obj = {} as AclBase;
        expect(checkAuth(obj, user)).toBe(false);
    });

    it('should return false if user is not provided', () => {
        const obj = { user: { id: 1 } } as AclBase;
        expect(checkAuth(obj, undefined)).toBe(false);
    });

    it('should return true if user matches obj.user', () => {
        const user = { id: 1 } as User;
        const obj = { user: { id: 1 } } as AclBase;
        expect(checkAuth(obj, user)).toBe(true);
    });

    it('should return false if user does not match obj.user', () => {
        const user = { id: 2 } as User;
        const obj = { user: { id: 1 } } as AclBase;
        expect(checkAuth(obj, user)).toBe(false);
    });
});

describe('getConditions', () => {
    it('should return an empty object for admin user', () => {
        const user = { roles: [Role.admin] } as User;
        expect(getConditions(user)).toEqual({});
    });

    it('should return an object with userId for non-admin user', () => {
        const user = { id: 1 } as User;
        expect(getConditions(user)).toEqual({ userId: 1 });
    });
});
