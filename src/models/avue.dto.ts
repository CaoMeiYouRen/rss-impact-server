import { ApiProperty } from '@nestjs/swagger'
import { AvueCrudConfig, Field, AvueCrudOption } from '@/interfaces/avue'

export class Rule {
    required: boolean
    message: string
    trigger: string
}
export class DicData {
    label: string
    value: string
}
export class Column implements Field {
    label: string
    prop: string
    @ApiProperty({
        type: String,
    })
    type: Field['type']
    overHidden?: boolean
    value?: boolean | number | string
    addDisplay?: boolean
    editDisabled?: boolean
    readonly?: boolean
    max?: number
    min?: number
    format?: string
    @ApiProperty({
        type: [Rule],
    })
    rules?: Rule[]
    maxlength?: number
    minlength?: number
    alone?: boolean
    @ApiProperty({
        type: [DicData],
    })
    dicData?: DicData[]
}
export class Option implements AvueCrudOption {
    index?: boolean
    align?: string
    border?: boolean
    stripe?: boolean
    columnBtn?: boolean
    refreshBtn?: boolean
    addBtn?: boolean
    editBtn?: boolean
    delBtn?: boolean
    viewBtn?: boolean
    excelBtn?: boolean
    title?: string
    @ApiProperty({
        type: [Column],
    })
    column: Column[]

}

export class AvueCrudConfigImpl implements AvueCrudConfig {
    @ApiProperty({
        type: Option,
    })
    option: Option
}
