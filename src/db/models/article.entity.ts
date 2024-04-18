import { Entity, Column, Index, ManyToOne } from 'typeorm'
import { Item, Enclosure } from 'rss-parser'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsArray, IsDate, IsNotEmpty, IsObject, IsString, IsUrl, Length, ValidateIf, ValidateNested } from 'class-validator'
import dayjs from 'dayjs'
import { Type } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'
import { IsId } from '@/decorators/is-id.decorator'
import { JsonStringLength } from '@/decorators/json-string-length.decorator'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { IsUrlOrMagnetUri } from '@/decorators/is-url-or-magnet-uri.decorator'
import { __DEV__ } from '@/app.config'

export class EnclosureImpl implements Enclosure {

    @ApiProperty({ title: 'URL', example: 'http://bt.example.com' }) //  examples: ['http://bt.example.com', 'magnet:?xt=urn:btih:xxxxx']
    @IsUrlOrMagnetUri({}, {
        require_tld: !__DEV__,   // 是否要顶级域名
    })
    @Length(0, 65000)
    @ValidateIf((o) => typeof o.url !== 'undefined')
    url: string

    @ApiProperty({ title: '长度', example: 114514 })
    @IsSafeNaturalNumber()
    @ValidateIf((o) => typeof o.length !== 'undefined')
    length?: number

    @ApiProperty({ title: '媒体类型', example: 'application/x-bittorrent' })
    @Length(0, 128)
    @ValidateIf((o) => typeof o.type !== 'undefined')
    type?: string
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
export class Article extends AclBase implements Item {

    /** guid/id */
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '全局索引', example: '499d4cee' })
    @IsNotEmpty()
    @Index({
        // unique: true,
    })
    @Column({
        length: 2048,
        // unique: true,
    })
    guid: string

    @ApiProperty({ title: '链接', example: 'https://blog.cmyr.ltd/archives/499d4cee.html' })
    @IsUrl({
        require_tld: !__DEV__, // 是否要顶级域名
    })
    @Length(0, 2048)
    @ValidateIf((o) => typeof o.link !== 'undefined')
    @Column({
        length: 2048,
        nullable: true,
    })
    link?: string

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '标题', example: '这是一个标题' })
    @Length(0, 256)
    @ValidateIf((o) => typeof o.title !== 'undefined')
    @Column({
        length: 256,
        nullable: true,
    })
    title?: string

    /** 正文 content/content:encoded */
    @ApiProperty({ title: '正文', example: '这是一段正文' })
    @Length(0, 2 ** 20)
    @ValidateIf((o) => typeof o.content !== 'undefined')
    @Column({
        type: 'text',
        length: 2 ** 20, // 1048576
        nullable: true,
    })
    content?: string

    // TODO 考虑迁移到 pubDate
    /**
     *发布日期 pubDate/isoDate
     */
    @SetAclCrudField({
        search: true,
        searchRange: true,
    })
    @ApiProperty({ title: '发布日期', example: dayjs('2024-01-01').toDate() })
    @Type(() => Date)
    @IsDate()
    @ValidateIf((o) => typeof o.publishDate !== 'undefined')
    @Column({
        nullable: true,
    })
    publishDate?: Date

    /** 作者 creator/author/dc:creator */
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '作者', example: 'CaoMeiYouRen' })
    @Length(0, 128)
    @ValidateIf((o) => typeof o.author !== 'undefined')
    @Column({
        length: 128,
        nullable: true,
    })
    author?: string

    // contentSnippet/content:encodedSnippet
    @ApiProperty({ title: '摘要', description: '纯文本格式，无 HTML', example: '这是一段内容摘要' })
    @Length(0, 65536) // 65536
    @ValidateIf((o) => typeof o.summary !== 'undefined')
    @Column({
        type: 'text',
        length: 65536,
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
    @Length(0, 1024)
    @ValidateIf((o) => typeof o.summary !== 'undefined')
    @Column({
        length: 1024,
        nullable: true,
    })
    summary?: string

    /**
     * 分类列表，和 RSS 的分组不是同一个
     */
    @SetAclCrudField({
        type: 'array',
        search: true,
    })
    @ApiProperty({ title: '分类列表', description: 'RSS 源定义的分类，和 本地RSS 的分组不是同一个', example: ['tag1', 'tag2'] })
    @JsonStringLength(0, 512)
    @IsArray()
    @IsString({ each: true })
    @ValidateIf((o) => typeof o.categories !== 'undefined')
    @Column({
        type: 'simple-json', // 用 json 来避免逗号问题
        length: 512,
        nullable: true,
    })
    categories?: string[]

    /** 附件 enclosure/mediaContent */
    @ApiProperty({ title: '附件', type: () => EnclosureImpl })
    @Type(() => EnclosureImpl)
    @ValidateNested()
    @JsonStringLength(0, 65536) // 2 ** 16
    @IsObject()
    @ValidateIf((o) => typeof o.enclosure !== 'undefined')
    @Column({
        type: 'simple-json',
        length: 65536,
        nullable: true,
        default: '{}',
    })
    enclosure?: EnclosureImpl

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
    @Column({ nullable: true })
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
