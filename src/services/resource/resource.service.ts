import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import fs from 'fs-extra'
import { Resource } from '@/db/models/resource.entiy'
import { User } from '@/db/models/user.entity'
import { isId } from '@/decorators/is-id.decorator'
import { HttpError } from '@/models/http-error'
import { checkAuth } from '@/utils/check'

@Injectable()
export class ResourceService {

    constructor(@InjectRepository(Resource) private readonly repository: Repository<Resource>) {
    }

    // 当所有 resource 的状态都不为 success 时，移除真实路径上的文件
    // 但不会删除数据库记录
    async removeFile(resource: Resource) {
        const { url, path: filepath } = resource
        const resources = await this.repository.find({
            where: {
                url,
            },
        })
        // 如果有一个为 success，则不移除该文件
        if (resources.some((res) => res.status === 'success')) {
            return false
        }
        await fs.remove(filepath)
        return true
    }

    async delete(id: number, user: User) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const document = await this.repository.findOne({
            where: {
                id,
            },
            relations: ['user'],
        })
        if (!checkAuth(document, user)) {
            throw new HttpError(403, '该用户没有权限访问')
        }
        if (!document) {
            throw new HttpError(404, '该 Id 对应的资源不存在！')
        }
        await this.repository.delete(id) // 移除数据库记录
        if (document.path) { // 如果存在本地的路径
            await this.removeFile(document)
        } // 尝试移除真实文件
        return document
    }
}
