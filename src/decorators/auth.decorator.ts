import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiHeader, ApiQuery } from '@nestjs/swagger'
import { ApiBaseDes } from './api-base-des.decorator'
import { RolesGuard } from '@/guards/roles.guard'

type AuthType = 'local' | 'token' | 'session' // 'jwt' |

/**
 * 权限控制装饰器
 *
 * @author CaoMeiYouRen
 * @export
 * @param {...string[]} roles
 * @returns
 */
export function Auth(authType: AuthType = 'session', ...roles: string[]) {
    const decorators = [
        SetMetadata('roles', roles),
        UseGuards(AuthGuard(authType), RolesGuard),
        ApiBaseDes(),
        authType === 'token' && ApiQuery({
            name: 'accessToken',
            required: false,
        }),
        authType === 'token' && ApiHeader({
            name: 'access-token',
            required: false,
        }),
    ].filter(Boolean)
    return applyDecorators(
        ...decorators,
    )
}
