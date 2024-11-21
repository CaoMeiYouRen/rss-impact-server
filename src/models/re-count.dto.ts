import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

export class ReCountDto {
    @SetAclCrudField({
        span: 24,
        value: 30,
    })
    @IsSafeNaturalNumber(365)
    @IsNotEmpty()
    @ApiProperty({ title: '天数', description: '默认为 30 天内', example: 30 })
    dayNum: number
}
