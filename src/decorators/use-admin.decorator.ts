import { Auth } from './auth.decorator'
import { Role } from '@/constant/role'

export function UseAdmin() {
    return Auth('session', Role.admin)
}
