import { Auth } from './auth.decorator'

export function UseSession() {
    return Auth('session')
}
