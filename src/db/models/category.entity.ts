import { Entity, ManyToMany, OneToMany } from 'typeorm'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsArray, IsNotEmpty, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'
import { CustomQuery } from './custom-query.entity'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { CustomColumn } from '@/decorators/custom-column.decorator'

/**
 * 分类表
 *
 * @author CaoMeiYouRen
 * @date 2024-03-20
 * @export
 * @class Category
 */
@Entity()
export class Category extends AclBase {

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '名称', example: '分类A' })
    @IsNotEmpty({ message: '名称不能为空' })
    @CustomColumn({
        index: true,
        length: 256,
    })
    name: string

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '简介', example: '分类A' })
    @CustomColumn({
        nullable: true,
        length: 4096,
    })
    description?: string

    @SetAclCrudField({
        type: 'select',
        multiple: true,
        dicUrl: '/feed/dicData',
        props: {
            label: 'title',
            value: 'id',
        },
    })
    @ApiProperty({ title: '订阅链接', example: [], type: () => [Feed] })
    @IsOptional()
    @OneToMany(() => Feed, (feed) => feed.category)
    feeds: Feed[]

    @SetAclCrudField({
        type: 'select',
        multiple: true,
        dicUrl: '/custom-query/dicData',
        props: {
            label: 'name',
            value: 'id',
        },
    })
    @ApiProperty({ title: '自定义查询列表', example: [], type: () => [CustomQuery] })
    @Type(() => CustomQuery)
    @IsArray()
    @IsOptional()
    @ManyToMany(() => CustomQuery, (customQuery) => customQuery.categories) // JoinTable 在 CustomQuery 这边
    customQueries: CustomQuery[]

}

export class CreateCategory extends OmitType(Category, ['id', 'createdAt', 'updatedAt'] as const) { }

export class UpdateCategory extends PartialType(OmitType(Category, ['createdAt', 'updatedAt'] as const)) { }

export class FindCategory extends FindPlaceholderDto<Category> {
    @ApiProperty({ type: () => [Category] })
    declare data: Category[]
}
