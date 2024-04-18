import { applyDecorators } from '@nestjs/common'
import { ApiCookieAuth } from '@nestjs/swagger'
import { Auth } from './auth.decorator'

export function UseSession() {
    return applyDecorators(
        Auth('session'),
        ApiCookieAuth,
    )
}
