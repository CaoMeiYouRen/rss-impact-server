import { Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsIn, IsInt, IsObject, IsOptional, Max, Min } from 'class-validator'
import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'
import { Type } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Hook } from './hook.entity'
import { Feed } from './feed.entity'
import { Article } from './article.entity'
import { IsId } from '@/decorators/is-id.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { LogStatusList, LogStatusType, LogType, LogTypeList } from '@/constant/hook'
import { CustomColumn } from '@/decorators/custom-column.decorator'

/**
 * webhook 执行结果
 *
 * @author CaoMeiYouRen
 * @date 2024-03-25
 * @export
 * @class WebhookLog
 */
@Entity()
export class WebhookLog extends AclBase {

    @ApiProperty({ title: '状态码', example: 200 })
    @IsInt()
    @Min(100)
    @Max(600)
    @CustomColumn({})
    statusCode: number

    @SetAclCrudField({
        type: 'select',
        dicData: LogTypeList,
        search: true,
    })
    @ApiProperty({ title: '类型', description: 'webhook 或 notification', example: 'webhook' })
    @IsIn(LogTypeList.map((e) => e.value))
    @CustomColumn({
        length: 16,
    })
    type: LogType

    // @ApiProperty({ title: '标题', example: '这是一个标题' })
    // @CustomColumn({
    //     length: 256,
    //     nullable: true,
    // })
    // title?: string

    // @ApiProperty({ title: '正文', example: '这是一个正文' })
    // @CustomColumn({
    //     type: 'text',
    //     length: 65535,
    //     nullable: true,
    // })
    // desp?: string

    @SetAclCrudField({
        type: 'select',
        multiple: true,
        dicUrl: '/article/dicData',
        props: {
            label: 'title',
            value: 'id',
        },
    })
    @ApiProperty({ title: '文章列表', example: [], type: () => [Article] })
    @Type(() => Article)
    @IsArray()
    @IsOptional()
    @ManyToMany(() => Article)
    @JoinTable()
    articles?: Article[]

    @SetAclCrudField({
        type: 'select',
        dicData: LogStatusList,
        search: true,
    })
    @ApiProperty({ title: '状态', example: 'success' })
    @IsIn(LogStatusList.map((e) => e.value))
    @CustomColumn({
        length: 16,
    })
    status: LogStatusType

    @ApiProperty({ title: '状态码名称', example: 'OK' })
    @CustomColumn({
        length: 128,
    })
    statusText: string

    @ApiProperty({ title: '响应体', example: { message: 'OK' } })
    @CustomColumn({
        type: 'simple-json',
        length: 65535,
        nullable: true,
    })
    data?: any

    @ApiProperty({ title: '响应头', example: {} })
    @IsObject()
    @CustomColumn({
        type: 'simple-json',
        length: 65535,
        nullable: true,
    })
    headers?: RawAxiosResponseHeaders | AxiosResponseHeaders

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
    @ManyToOne(() => Feed)
    feed: Feed

    @SetAclCrudField({
        search: true,
        dicUrl: '/hook/dicData',
        props: {
            label: 'name',
            value: 'id',
        },
    })
    @ApiProperty({ title: 'Hook', example: 1 })
    @IsId()
    @CustomColumn({ type: 'bigint', nullable: true })
    hookId: number

    @SetAclCrudField({
        hide: true,
    })
    @ApiProperty({ title: 'Hook', type: () => Hook })
    @ManyToOne(() => Hook)
    hook: Hook

}

export class FindWebhookLog extends FindPlaceholderDto<WebhookLog> {

    @ApiProperty({ type: () => [WebhookLog] })
    declare data: WebhookLog[]

}
