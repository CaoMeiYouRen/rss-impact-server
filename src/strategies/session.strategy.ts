import { Strategy } from 'passport-strategy'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { Injectable } from '@nestjs/common'
import { HttpError } from '@/models/http-error'
import { UserService } from '@/services/user/user.service'
import { isId } from '@/decorators/is-id.decorator'
import { ISession } from '@/interfaces/session'

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy, 'session') {
    constructor(
        private readonly userService: UserService,
    ) {
        super()
    }

    authenticate(req: Request): void {
        const session = req.session as ISession
        const uid = session?.uid
        if (!isId(uid)) {
            throw new HttpError(401, '用户未登录！')
        }
        this.validate(uid)
            .then((user) => {
                this.success(user)
            })
            .catch((error) => {
                this.error(error)
            })
    }

    async validate(id: number) {
        const user = await this.userService.findOne({
            id,
        })
        if (!user) {
            throw new HttpError(401, '无效的 uid ！')
        }
        return user
    }
}
