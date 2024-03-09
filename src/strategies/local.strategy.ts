import { IStrategyOptionsWithRequest, Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { compare } from 'bcryptjs'
import { AuthService } from '@/services/auth/auth.service'
import { USER_REPOSITORY } from '@/db/database.providers'
import { User } from '@/db/models/user.entity'
import { HttpError } from '@/models/http-error'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {

    private readonly logger: Logger = new Logger(LocalStrategy.name)

    constructor(@Inject(USER_REPOSITORY) private readonly userRepository: Repository<User>) {
        super({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
        } as IStrategyOptionsWithRequest)
    }

    async validate(request: Request, username: string, password: string): Promise<any> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .where({
                username,
            })
            .addSelect('user.password')
            .getOne()
        // this.logger.debug(JSON.stringify(user))
        if (!user) {
            // throw new UnauthorizedException()
            throw new HttpError(401, '用户名或密码错误！')
        }
        if (!await compare(password, user.password)) {
            throw new HttpError(401, '用户名或密码错误！')
        }
        delete user.password
        return user
    }
}
