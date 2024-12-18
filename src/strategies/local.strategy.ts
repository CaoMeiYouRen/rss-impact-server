import { IStrategyOptionsWithRequest, Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, Logger } from '@nestjs/common'
import { Repository } from 'typeorm'
import { compare } from 'bcrypt'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '@/db/models/user.entity'
import { HttpError } from '@/models/http-error'
import { DISABLE_PASSWORD_LOGIN } from '@/app.config'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {

    private readonly logger: Logger = new Logger(LocalStrategy.name)

    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {
        super({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
        } as IStrategyOptionsWithRequest)
    }

    async validate(request: Request, username: string, password: string): Promise<any> {
        if (DISABLE_PASSWORD_LOGIN) {
            throw new HttpError(401, '当前不允许通过账号密码登录！')
        }
        const user = await this.userRepository
            .createQueryBuilder('user')
            .where({
                username,
            })
            .addSelect('user.password')
            .getOne()
        // __DEV__ && this.logger.debug(JSON.stringify(user))
        if (!user) {
            // throw new UnauthorizedException()
            throw new HttpError(401, '用户名或密码错误！')
        }
        if (user.disablePasswordLogin) {
            throw new HttpError(401, '该用户不允许通过账号密码登录！')
        }
        const hash = user.password
        if (!await compare(password, hash)) {
            throw new HttpError(401, '用户名或密码错误！')
        }
        delete user.password
        return user
    }
}
