import { Inject, Injectable } from '@nestjs/common'
import { FindOptionsWhere, Repository } from 'typeorm'
import { USER_REPOSITORY } from '@/db/database.providers'
import { User } from '@/db/models/user.entity'
import { HttpError } from '@/models/HttpError'

@Injectable()
export class UserService {
    constructor(@Inject(USER_REPOSITORY) private readonly userRepository: Repository<User>) {
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

    async create(user: User) {
        delete user.id
        delete user.createdAt
        delete user.updatedAt
        if (await this.findOne({ username: user.username })) {
            throw new HttpError(400, 'The username already exists!')
        }
        if (await this.findOne({ email: user.email })) {
            throw new HttpError(400, 'The email already exists!')
        }
        const newUser = await this.userRepository.save(user)
        delete newUser.password
        return newUser
    }

    async update(user: User) {
        const id = user.id
        delete user.createdAt
        delete user.updatedAt
        if (!user.password) {
            delete user.password
        }
        await this.userRepository.update({
            id,
        }, user)
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
