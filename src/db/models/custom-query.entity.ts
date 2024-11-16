import { AfterLoad, BeforeInsert, Entity, JoinTable, ManyToMany } from 'typeorm'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsObject, ValidateNested, IsIn, IsArray, IsBoolean, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'
import _ from 'lodash'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'
import { Category } from './category.entity'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { OutputType, OutputList, ScopeType, ScopeList } from '@/constant/custom-query'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { getAccessToken } from '@/utils/helper'
import { BASE_URL } from '@/app.config'
import { Filter } from '@/models/filter.dto'
import { FilterOut } from '@/models/filter-out.dto'
import { CustomColumn } from '@/decorators/custom-column.decorator'

/**
 * 自定义 RSS 查询
 *
 * @author CaoMeiYouRen
 * @date 2024-04-21
 * @export
 * @class CustomQuery
 */
@Entity()
export class CustomQuery extends AclBase {
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '名称', example: '查询A' })
    @CustomColumn({
        length: 256,
    })
    name: string

    @SetAclCrudField({
        // search: true,
        type: 'select',
        dicData: ScopeList,
        value: 'all',
    })
    @ApiProperty({ title: '查询范围', description: '指定分类和指定订阅的配置互斥，只按照本项指定的范围查询', example: 'all' })
    @IsIn(ScopeList.map((e) => e.value))
    @CustomColumn({
        length: 32,
        default: 'all',
        nullable: true,
    })
    scope: ScopeType

    @SetAclCrudField({
        type: 'select',
        multiple: true,
        dicUrl: '/category/dicData',
        props: {
            label: 'name',
            value: 'id',
        },
    })
    @ApiProperty({ title: '指定分类', description: '支持选择多个分类', example: [], type: [Category] })
    @Type(() => Category)
    @IsArray()
    @IsOptional()
    @ManyToMany(() => Category, (category) => category.customQueries)
    @JoinTable()
    categories?: Category[]

    @SetAclCrudField({
        type: 'select',
        multiple: true,
        dicUrl: '/feed/dicData',
        props: {
            label: 'title',
            value: 'id',
        },
    })
    @ApiProperty({ title: '指定订阅', description: '支持选择多个订阅', example: [], type: () => [Feed] })
    @Type(() => Feed)
    @IsArray()
    @IsOptional()
    @ManyToMany(() => Feed, (feed) => feed.customQueries)
    @JoinTable()
    feeds?: Feed[]

    @SetAclCrudField({
        search: true,
        type: 'select',
        dicData: OutputList,
        value: 'rss2.0',
    })
    @ApiProperty({ title: '输出格式', example: 'rss2.0' })
    @IsIn(OutputList.map((e) => e.value))
    @CustomColumn({
        length: 32,
        default: 'rss2.0',
    })
    format: OutputType

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '使用 AI 总结', description: '如果是，则用 AI 总结替换原本的总结' })
    @IsBoolean()
    @CustomColumn({
        default: false,
        nullable: true,
    })
    useAiSummary: boolean

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '增加 AI 总结', description: '如果是，则将 AI 总结 增加 到正文前，以方便通过 RSS 阅读器阅读' })
    @IsBoolean()
    @CustomColumn({
        default: false,
        nullable: true,
    })
    appendAiSummary: boolean

    @SetAclCrudField({
        addDisplay: false,
        // editDisabled: true,
    })
    @ApiProperty({ title: '访问秘钥', description: '通过访问秘钥即可无需登录访问 RSS 订阅。一旦泄露，请立即修改！', example: 'custom-query-key:2c28d0b6-47db-43a4-aff4-439edbe29200' })
    @CustomColumn({
        length: 256,
        nullable: true,
    })
    key: string

    @BeforeInsert()
    private createAccessToken() { // 初始化 key
        if (!this.key) {
            this.key = getAccessToken('custom-query-key')
        }
    }

    @SetAclCrudField({
        type: 'url',
        alone: true,
        addDisplay: false,
        editDisabled: true,
    })
    @ApiProperty({ title: '输出路径' })
    url?: string

    @AfterLoad() // 生成输出 url
    private updateUrl() {
        if (!_.isNil(this.key)) {
            this.url = new URL(`${BASE_URL}/api/custom-query/rss/${this.id}?key=${this.key}`, BASE_URL).toString()
        }
    }

    @SetAclCrudField({
    })
    @ApiProperty({ title: '过滤条件', description: '保留想要的内容，必须符合全部条件才保留。支持通过正则表达式过滤。留空的规则不会过滤。', type: Filter })
    @Type(() => Filter)
    @ValidateNested()
    @IsObject()
    @CustomColumn({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    filter: Filter

    @SetAclCrudField({
    })
    @ApiProperty({ title: '排除条件', description: '去掉不要的内容，有一个条件符合就排除。支持通过正则表达式排除。留空的规则不会排除。', type: FilterOut })
    @Type(() => FilterOut)
    @ValidateNested()
    @IsObject()
    @CustomColumn({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    filterout: FilterOut
}

export class CreateCustomQuery extends OmitType(CustomQuery, ['id', 'createdAt', 'updatedAt', 'key'] as const) { }

export class UpdateCustomQuery extends PartialType(OmitType(CustomQuery, ['createdAt', 'updatedAt', 'key'] as const)) { }

export class FindCustomQuery extends FindPlaceholderDto<CustomQuery> {
    @ApiProperty({ type: () => [CustomQuery] })
    declare data: CustomQuery[]
}
