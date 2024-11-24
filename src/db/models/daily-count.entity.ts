import { Entity } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Base } from './base.entity'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { CustomColumn } from '@/decorators/custom-column.decorator'

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
    @CustomColumn({
        index: true,
        length: 16,
    })
    date: string

    @ApiProperty({ title: '原始日期', example: new Date('2024-01-01') })
    @CustomColumn({
        index: true,
        nullable: true,
    })
    rawDate: Date

    @ApiProperty({ title: '文章数量', example: 114 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        default: 0,
    })
    articleCount: number

    @ApiProperty({ title: '资源数量', example: 514 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        default: 0,
    })
    resourceCount: number

    @ApiProperty({ title: 'Webhook和通知日志数量', example: 233 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        default: 0,
    })
    webhookLogCount: number

    @ApiProperty({ title: 'RSS订阅源数量', example: 233 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        default: 0,
    })
    feedCount: number

    @ApiProperty({ title: '分类数量', example: 233 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        default: 0,
    })
    categoryCount: number

    @ApiProperty({ title: 'Hook数量', example: 233 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        default: 0,
    })
    hookCount: number

    @ApiProperty({ title: '自定义查询数量', example: 233 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        default: 0,
    })
    customQueryCount: number

    @ApiProperty({ title: '代理数量', example: 233 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        default: 0,
    })
    proxyConfigCount: number

    @ApiProperty({ title: '用户数量', example: 233 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        default: 0,
    })
    userCount: number
}

export class FindDailyCount extends FindPlaceholderDto<DailyCount> {
    @ApiProperty({ type: () => [DailyCount] })
    declare data: DailyCount[]
}
