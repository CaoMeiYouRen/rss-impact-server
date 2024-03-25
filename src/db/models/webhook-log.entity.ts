import { Column, Entity, ManyToOne } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsObject, Length, Max, Min, ValidateIf } from 'class-validator'
import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'
import { AclBase } from './acl-base.entity'
import { Hook } from './hook.entity'
import { IsId } from '@/decorators/is-id.decorator'
import { JsonStringLength } from '@/decorators/json-string-length.decorator'

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

    @ApiProperty({ title: '响应体', example: { message: 'OK' } })
    @JsonStringLength(0, 2048)
    @ValidateIf((o) => typeof o.data !== 'undefined')
    @Column({
        type: 'simple-json',
        length: 2048,
        nullable: true,
    })
    data?: any

    @ApiProperty({ title: '状态码', example: 200 })
    @IsNotEmpty()
    @IsInt()
    @Min(100)
    @Max(600)
    @Column({})
    status: number

    @ApiProperty({ title: '状态码名称', example: 'OK' })
    @IsNotEmpty()
    @Length(0, 128)
    @Column({
        length: 128,
    })
    statusText: string

    @ApiProperty({ title: '响应头', example: {} })
    @JsonStringLength(0, 2048)
    @IsObject()
    @ValidateIf((o) => typeof o.headers !== 'undefined')
    @Column({
        type: 'simple-json',
        length: 2048,
        nullable: true,
    })
    headers?: RawAxiosResponseHeaders | AxiosResponseHeaders

    @ApiProperty({ title: 'HookID', example: 1 })
    @IsId()
    @Column({ nullable: true })
    hookId: number

    @ApiProperty({ title: 'Hook', type: () => Hook })
    @ManyToOne(() => Hook)
    hook: Hook
}
