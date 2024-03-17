import { Auth } from './auth.decorator'

/**
 *  使用 accessToken 验权
 * @param roles 角色
 * @returns
 */
export const UseAccessToken = (...roles: string[]) => Auth('token', ...roles)

// applyDecorators(
// SetMetadata('roles', roles),
// UseGuards(AuthGuard('token'), RolesGuard),
// ApiBaseDes(),
// ApiHeader({
//     name: 'access-token',
//     required: false,
// }),
// ApiQuery({
//     name: 'accessToken',
//     required,
// }),
// )
