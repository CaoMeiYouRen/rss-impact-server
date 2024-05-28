import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { FindOptionsWhere, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { CreateUser, UpdateUser, User } from '@/db/models/user.entity'
import { HttpError } from '@/models/http-error'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '@/app.config'
import { Role } from '@/constant/role'

@Injectable()
export class UserService implements OnApplicationBootstrap {

    private readonly logger = new Logger(UserService.name)

    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {
    }

    onApplicationBootstrap() {
        this.initAdmin()
    }

    private async initAdmin() {
        // 初始化 admin 用户
        const userCount = await this.userRepository.count({})
        if (userCount === 0) {
            await this.create({
                username: 'admin',
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                roles: [Role.admin, Role.user],
            })
            this.logger.log('初始化 admin 用户成功')
        }
    }

    async dicData() {
        return (await this.userRepository.find({
            where: {},
            select: ['id', 'username'],
        })).map((e) => ({
            label: e.username,
            value: e.id,
        }))
    }

    async find(where: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
        return this.userRepository.find({
            where,
        })
    }

    async findOne(where: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
        return this.userRepository.findOne({
            where,
        })
    }

    async findOneById(id: number) {
        return this.userRepository.findOne({
            where: {
                id,
            },
        })
    }

    async create(user: CreateUser) {
        if (await this.findOne({ username: user.username })) {
            throw new HttpError(400, '用户名已存在！')
        }
        if (await this.findOne({ email: user.email })) {
            throw new HttpError(400, '邮箱已存在！')
        }
        const newUser = await this.userRepository.save(this.userRepository.create(user))
        delete newUser.password
        return newUser
    }

    async update(user: UpdateUser) {
        const id = user.id
        if (!user.password) {
            delete user.password
        }
        await this.userRepository.update({
            id,
        }, user)
        //   await  this.userRepository.save(this.userRepository.create(user))
        return this.userRepository.findOne({
            where: {
                id,
            },
        })
    }

    async delete(id: number) {
        await this.userRepository.delete(id)
        return {
            id,
        }
    }
}
