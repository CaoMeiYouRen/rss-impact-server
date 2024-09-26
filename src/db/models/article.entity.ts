import { Entity, ManyToOne, AfterLoad } from 'typeorm'
import { Enclosure } from '@cao-mei-you-ren/rss-parser'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsArray, IsDate, IsOptional, IsString, Length } from 'class-validator'
import dayjs from 'dayjs'
import { Type } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'
import { IsId } from '@/decorators/is-id.decorator'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { IsUrlOrMagnetUri } from '@/decorators/is-url-or-magnet-uri.decorator'
import { dataFormat } from '@/utils/helper'
import { IsCustomURL } from '@/decorators/is-custom-url.decorator'
import { CustomColumn } from '@/decorators/custom-column.decorator'

export class EnclosureImpl implements Enclosure {

    @ApiProperty({ title: 'URL', example: 'http://bt.example.com' }) //  examples: ['http://bt.example.com', 'magnet:?xt=urn:btih:xxxxx']
    @IsUrlOrMagnetUri()
    @Length(0, 65000)
    @IsOptional()
    url: string

    @ApiProperty({ title: '媒体类型', example: 'application/x-bittorrent' })
    @Length(0, 128)
    @IsOptional()
    type?: string

    @SetAclCrudField({
        labelWidth: 105,
        type: 'input',
    })
    @ApiProperty({ title: '文件体积(B)', example: 114514 })
    @IsSafeNaturalNumber()
    @IsOptional()
    length?: number

    @SetAclCrudField({
        labelWidth: 105,
        type: 'input',
    })
    @ApiProperty({ title: '文件体积', description: '单位为 B(字节)', example: '114.51 MiB' })
    lengthFormat?: string

}

/**
 * 文章
 *
 * @author CaoMeiYouRen
 * @date 2024-03-21
 * @export
 * @class Article
 */
@Entity()
export class Article extends AclBase {

    /** guid/id */
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '全局索引', example: '499d4cee' })
    @CustomColumn({
        index: true,
        length: 2048,
    })
    guid: string

    @ApiProperty({ title: '链接', example: 'https://blog.cmyr.ltd/archives/499d4cee.html' })
    @IsCustomURL()
    @CustomColumn({
        length: 2048,
        nullable: true,
    })
    link?: string

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '标题', example: '这是一个标题' })
    @CustomColumn({
        length: 256,
        nullable: true,
    })
    title?: string

    /** 正文 content/content:encoded */
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '正文', example: '这是一段正文' })
    @CustomColumn({
        type: 'text',
        length: 2 ** 20, // 1048576  (sqlite varchar 上限 2147483647)
        nullable: true,
    })
    content?: string

    /**
   *发布日期 pubDate/isoDate
   */
    @SetAclCrudField({
        search: true,
        searchRange: true,
        width: 160,
    })
    @ApiProperty({ title: '发布日期', example: dayjs('2024-01-01').toDate() })
    @Type(() => Date)
    @IsDate()
    @CustomColumn({
        nullable: true,
    })
    pubDate?: Date

    /** 作者 creator/author/dc:creator */
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '作者', example: 'CaoMeiYouRen' })
    @CustomColumn({
        length: 128,
        nullable: true,
    })
    author?: string

    // contentSnippet/content:encodedSnippet
    @SetAclCrudField({
        type: 'textarea',
        search: true,
    })
    @ApiProperty({ title: '摘要', description: '纯文本格式，无 HTML', example: '这是一段内容摘要' })
    @CustomColumn({
        type: 'text',
        length: 65535,
        nullable: true,
    })
    contentSnippet?: string

    /**
     * 总结 summary
     */
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '总结', example: '这是一段总结' })
    @CustomColumn({
        length: 1024,
        nullable: true,
    })
    summary?: string

    /**
     * AI 总结
     */
    @SetAclCrudField({
        type: 'textarea',
        search: true,
    })
    @ApiProperty({ title: 'AI 总结', example: '这是一段 AI 总结' })
    @CustomColumn({
        type: 'text',
        length: 65535,
        nullable: true,
    })
    aiSummary?: string

    /**
     * 分类列表，和 RSS 的分类不是同一个
     */
    @SetAclCrudField({
        type: 'array',
        search: true,
    })
    @ApiProperty({ title: '分类列表', description: 'RSS 源定义的分类，和 本地RSS 的分类不是同一个', example: ['tag1', 'tag2'] })
    @IsArray()
    @IsString({ each: true })
    @CustomColumn({
        type: 'simple-json', // 用 json 来避免逗号问题
        length: 512,
        nullable: true,
        default: '[]',
    })
    categories?: string[]

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '附件URL', example: 'http://bt.example.com' }) //  examples: ['http://bt.example.com', 'magnet:?xt=urn:btih:xxxxx']
    @IsUrlOrMagnetUri()
    @CustomColumn({
        type: 'text',
        length: 65535,
        nullable: true,
    })
    enclosureUrl?: string

    @SetAclCrudField({
        search: true,
        type: 'select',
        dicUrl: 'article/typeDicData',
        minWidth: 180,
    })
    @ApiProperty({ title: '附件类型', example: 'application/x-bittorrent' })
    @CustomColumn({
        nullable: true,
        length: 128,
    })
    enclosureType?: string

    @SetAclCrudField({
        labelWidth: 105,
        type: 'input',
        hide: true,
    })
    @ApiProperty({ title: '附件体积(B)', description: '单位为 B(字节)', example: 114514 })
    @IsSafeNaturalNumber(Number.MAX_SAFE_INTEGER)
    @CustomColumn({ type: 'bigint', nullable: true })
    enclosureLength?: number

    @SetAclCrudField({
        labelWidth: 105,
        type: 'input',
    })
    @ApiProperty({ title: '附件体积', description: '单位为 B(字节)', example: '114.51 MiB' })
    enclosureLengthFormat?: string

    @AfterLoad()
    protected updateEnclosure() {
        if (typeof this.enclosureLength === 'number') {
            this.enclosureLengthFormat = dataFormat(this.enclosureLength)
        }
        // if (!this.enclosure) {
        //     this.enclosure = plainToInstance(EnclosureImpl, {})
        //     return
        // }
        // if (typeof this.enclosure.length === 'number') {
        //     this.enclosure.lengthFormat = dataFormat(this.enclosure.length)
        // }
        // this.enclosure = plainToInstance(EnclosureImpl, this.enclosure)
    }

    @SetAclCrudField({
        search: true,
        dicUrl: '/feed/dicData',
        props: {
            label: 'title',
            value: 'id',
        },
    })
    @ApiProperty({ title: '订阅源', example: 1 })
    @IsId()
    @CustomColumn({ type: 'bigint', nullable: true })
    feedId: number

    @SetAclCrudField({
        hide: true,
    })
    @ApiProperty({ title: '订阅源', type: () => Feed })
    @ManyToOne(() => Feed, (feed) => feed.articles)
    feed: Feed

}

export class CreateArticle extends OmitType(Article, ['id', 'createdAt', 'updatedAt'] as const) { }

export class UpdateArticle extends PartialType(OmitType(Article, ['createdAt', 'updatedAt'] as const)) { }

export class FindArticle extends FindPlaceholderDto<Article> {
    @ApiProperty({ type: () => [Article] })
    declare data: Article[]
}
