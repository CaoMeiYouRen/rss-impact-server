import { IStrategyOptionsWithRequest, Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, Logger } from '@nestjs/common'
import { Repository } from 'typeorm'
import { compare } from 'bcryptjs'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '@/db/models/user.entity'
import { HttpError } from '@/models/http-error'

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
        const hash = user.password
        // TODO 优化 compare 性能
        if (!await compare(password, hash)) {
            throw new HttpError(401, '用户名或密码错误！')
        }
        delete user.password
        return user

        // return new Promise((resolve, reject) => {
        //     const ext = path.extname(__filename)
        //     const workPath = path.resolve(__dirname, `../workers/login-worker${ext}`)
        //     // 创建一个 worker 线程来处理密码比对
        //     const worker = new Worker(workPath, {
        //         workerData: { password, hash },
        //     })
        //     worker.on('message', (isMatch) => {
        //         if (isMatch) {
        //             delete user.password
        //             // 登录成功
        //             resolve(user)
        //         } else {
        //             // 登录失败
        //             reject(new HttpError(401, '用户名或密码错误！'))
        //         }
        //     })

        //     worker.on('error', (err) => {
        //         this.logger.error('Error in worker:', err)
        //         reject(err)
        //     })

        // })
    }
}
