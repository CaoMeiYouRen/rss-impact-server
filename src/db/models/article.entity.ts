import { Entity, Column, Index, ManyToOne, AfterLoad } from 'typeorm'
import { Enclosure } from '@cao-mei-you-ren/rss-parser'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, IsUrl, Length } from 'class-validator'
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
import { __PROD__ } from '@/app.config'
import { dataFormat } from '@/utils/helper'

export class EnclosureImpl implements Enclosure {

    @ApiProperty({ title: 'URL', example: 'http://bt.example.com' }) //  examples: ['http://bt.example.com', 'magnet:?xt=urn:btih:xxxxx']
    @IsUrlOrMagnetUri({}, {
        require_tld: __PROD__,   // 是否要顶级域名
    })
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
        require_tld: __PROD__, // 是否要顶级域名
    })
    @Length(0, 2048)
    @IsOptional()
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
    @IsOptional()
    @Column({
        length: 256,
        nullable: true,
    })
    title?: string

    /** 正文 content/content:encoded */
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '正文', example: '这是一段正文' })
    @Length(0, 2 ** 20)
    @IsOptional()
    @Column({
        type: 'text',
        length: 2 ** 20, // 1048576   varchar 上限 2147483647
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
    @IsOptional()
    @Column({
        nullable: true,
    })
    pubDate?: Date

    /** 作者 creator/author/dc:creator */
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '作者', example: 'CaoMeiYouRen' })
    @Length(0, 128)
    @IsOptional()
    @Column({
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
    @Length(0, 65536) // 65536
    @IsOptional()
    @Column({
        // type: 'text',
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
    @IsOptional()
    @Column({
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
    @Length(0, 65536)
    @IsOptional()
    @Column({
        length: 65536,
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
    @JsonStringLength(0, 512)
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @Column({
        type: 'simple-json', // 用 json 来避免逗号问题
        length: 512,
        nullable: true,
    })
    categories?: string[]

    // /** 附件 enclosure/mediaContent */
    // @SetAclCrudField({
    //     hide: true,
    // })
    // @ApiProperty({ title: '附件', type: () => EnclosureImpl })
    // // @Type(() => EnclosureImpl)
    // // @ValidateNested()
    // @JsonStringLength(0, 65536) // 2 ** 16
    // @IsObject()
    // @IsOptional()
    // @Column({
    //     type: 'simple-json',
    //     length: 65536,
    //     nullable: true,
    //     // default: '{}',
    // })
    // enclosure?: EnclosureImpl

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '附件URL', example: 'http://bt.example.com' }) //  examples: ['http://bt.example.com', 'magnet:?xt=urn:btih:xxxxx']
    @IsUrlOrMagnetUri({}, {
        require_tld: __PROD__,   // 是否要顶级域名
    })
    @Length(0, 65536)
    @IsOptional()
    @Column({
        nullable: true,
        length: 65536,
    })
    enclosureUrl?: string

    @SetAclCrudField({
        search: true,
        type: 'select',
        dicUrl: 'article/typeDicData',
        minWidth: 180,
    })
    @ApiProperty({ title: '附件类型', example: 'application/x-bittorrent' })
    @Length(0, 128)
    @IsOptional()
    @Column({
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
    @IsSafeNaturalNumber()
    @IsOptional()
    @Column({ nullable: true })
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
