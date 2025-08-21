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
        type: () => [Rule],
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
class Option implements AvueCrudOption {

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
        type: () => [Column],
    })
    column: Column[]

    addRowBtn?: boolean
    calcHeight?: number
    cancelBtnTitle?: string
    dataType?: string
    cellBtn?: boolean
    dateBtn?: boolean
    cancelBtn?: boolean
    dateDefault?: boolean
    dicData?: any
    dicMethod?: string
    dicQuery?: any
    dicUrl?: string
    defaultSort?: any
    dialogFullscreen?: boolean
    dialogEscape?: boolean
    dialogClickModal?: boolean
    dialogCloseBtn?: boolean
    dialogModal?: boolean
    dialogTop?: string | number
    dialogType?: string
    dialogWidth?: string | number
    dialogHeight?: string | number
    defaultExpandAll?: boolean
    expandRowKeys?: string[]
    emptyText?: string
    expand?: boolean
    expandWidth?: number
    expandFixed?: boolean
    filterBtn?: boolean
    formWidth?: string | number
    height?: number
    header?: boolean
    indexLabel?: string
    indexWidth?: number
    indexFixed?: boolean
    rowKey?: string
    indeterminate?: boolean
    labelWidth?: number
    maxHeight?: number
    menu?: boolean
    menuWidth?: number
    menuXsWidth?: number
    menuAlign?: string
    menuType?: string
    menuBtnTitle?: string
    pageSize?: string
    pageSizes?: number[]
    printBtn?: boolean
    saveBtn?: boolean
    updateBtn?: boolean
    cancalBtn?: boolean
    saveBtnTitle?: string
    selection?: boolean
    selectionWidth?: number
    selectionFixed?: boolean
    searchBtn?: boolean
    selectable?: boolean
    selectClearBtn?: boolean
    showHeader?: boolean
    showSummary?: boolean
    sumColumnList?: string[]
    tip?: string
    tipPlacement?: string
    checkStrictly?: boolean
    updateBtnTitle?: string
    width?: number

}

export class Config implements AvueCrudConfig {

    @ApiProperty({
        type: () => Option,
    })
    option?: Option

}

export {
    Option as AvueCrudOption,
    Config as AvueCrudConfig,
}

