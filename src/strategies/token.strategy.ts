import { Strategy } from 'passport-strategy'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { Injectable } from '@nestjs/common'
import { HttpError } from '@/models/http-error'
import { UserService } from '@/services/user/user.service'

@Injectable()
export class TokenStrategy extends PassportStrategy(Strategy, 'token') {

    constructor(
        private readonly userService: UserService,
    ) {
        super()
    }

    authenticate(req: Request): void {
        const accessToken: string = req.header('access-token') || req.body?.accessToken || req.query?.accessToken
        if (!accessToken) {
            throw new HttpError(401, '未传递 accessToken ！')
        }
        this.validate(accessToken)
            .then((user) => {
                this.success(user)
            })
            .catch((error) => {
                this.error(error)
            })
    }

    async validate(accessToken: string) {
        const user = await this.userService.findOne({
            accessToken,
        })
        if (!user) {
            throw new HttpError(401, '无效的 accessToken ！')
        }
        return user
    }

}
