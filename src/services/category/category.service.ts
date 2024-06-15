import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Category } from '@/db/models/category.entity'
import { User } from '@/db/models/user.entity'

@Injectable()
export class CategoryService {

    constructor(
        @InjectRepository(Category) private readonly repository: Repository<Category>,
    ) {
    }

    /**
     * 查找或创建新的分类
     *
     * @author CaoMeiYouRen
     * @date 2024-06-15
     * @param name
     * @param user
     */
    public async findOrCreateCategory(name: string, user: User) {
        const category = await this.repository.findOne({
            where: {
                userId: user.id,
                name,
            },
        })
        if (category) {
            return category
        }
        return this.repository.save(this.repository.create({
            name,
            description: name,
            userId: user.id,
        }))
    }

    /**
     * 获取 未分类项 Uncategorized
     *
     * @author CaoMeiYouRen
     * @date 2024-06-15
     * @param user
     */
    public async findOrCreateUncategorizedCategory(user: User) {
        return this.findOrCreateCategory('未分类', user)
    }
}
