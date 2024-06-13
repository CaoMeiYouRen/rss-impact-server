import { Column, Entity, ManyToOne } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsObject, IsOptional, Length, Max, Min } from 'class-validator'
import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'
import { AclBase } from './acl-base.entity'
import { Hook } from './hook.entity'
import { Feed } from './feed.entity'
import { IsId } from '@/decorators/is-id.decorator'
import { JsonStringLength } from '@/decorators/json-string-length.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { LogStatusList, LogStatusType, LogType, LogTypeList } from '@/constant/hook'

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
    @IsNotEmpty()
    @IsInt()
    @Min(100)
    @Max(600)
    @Column({})
    statusCode: number

    @SetAclCrudField({
        type: 'select',
        dicData: LogTypeList,
        search: true,
    })
    @ApiProperty({ title: '类型', description: 'webhook 或 notification', example: 'webhook' })
    @IsNotEmpty()
    @Length(0, 16)
    @Column({
        length: 16,
    })
    type: LogType

    @SetAclCrudField({
        type: 'select',
        dicData: LogStatusList,
        search: true,
    })
    @ApiProperty({ title: '状态', example: 'success' })
    @IsNotEmpty()
    @Length(0, 16)
    @Column({
        length: 16,
    })
    status: LogStatusType

    @ApiProperty({ title: '状态码名称', example: 'OK' })
    @IsNotEmpty()
    @Length(0, 128)
    @Column({
        length: 128,
    })
    statusText: string

    @ApiProperty({ title: '响应体', example: { message: 'OK' } })
    @JsonStringLength(0, 65536)
    // @IsObject()
    @IsOptional()
    @Column({
        type: 'simple-json',
        length: 65536,
        nullable: true,
    })
    data?: any

    @ApiProperty({ title: '响应头', example: {} })
    @JsonStringLength(0, 65536)
    @IsObject()
    @IsOptional()
    @Column({
        type: 'simple-json',
        length: 65536,
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
    @Column({ nullable: true })
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
    @Column({ nullable: true })
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
