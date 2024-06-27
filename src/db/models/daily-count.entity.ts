import { Column, Entity, Index } from 'typeorm'
import { Length } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Base } from './base.entity'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'

/**
 * 每日计数：文章数/资源数/推送 webhook 数
 *
 * @author CaoMeiYouRen
 * @date 2024-06-27
 * @export
 * @class DailyCount
 */
@Entity()
export class DailyCount extends Base {

    @ApiProperty({ title: '日期', example: '2024-01-01' })
    @Length(0, 16)
    @Index()
    @Column({
        length: 16,
    })
    date: string

    @ApiProperty({ title: '文章数量', example: 114 })
    @IsSafeNaturalNumber()
    @Column({
        default: 0,
    })
    articleCount: number

    @ApiProperty({ title: '资源数量', example: 514 })
    @IsSafeNaturalNumber()
    @Column({
        default: 0,
    })
    resourceCount: number

    @ApiProperty({ title: 'Webhook和通知日志数量', example: 233 })
    @IsSafeNaturalNumber()
    @Column({
        default: 0,
    })
    webhookLogCount: number
}

