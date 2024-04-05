import { ApiProperty } from '@nestjs/swagger'
import { Base } from '@/db/models/base.entity'

export class FindPlaceholderDto<T extends Base = Base> {
    total: number

    @ApiProperty({ type: () => [Base] })
    data: T[]

    lastPage: number
    currentPage: number
}
