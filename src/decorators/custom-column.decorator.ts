import { applyDecorators } from '@nestjs/common'
import { Column, ColumnOptions, Index } from 'typeorm'
import { IsNotEmpty, IsOptional, Length } from 'class-validator'
import { JsonStringLength } from './json-string-length.decorator'
import { DATABASE_TYPE } from '@/app.config'

export function CustomColumn(options: ColumnOptions & { index?: boolean }) {
    const decorators: PropertyDecorator[] = []
    // if (DATABASE_TYPE === 'sqlite') { // sqlite 的话不修改配置

    // } else
    let length = options.length
    if (DATABASE_TYPE === 'mysql') { // 处理 MySQL 不兼容的配置
        // mysql 索引最大不超过 3072 字节，在 utf8 编码下不超过 1024 字符
        if (options.index && Number(options.length) > 1024) {
            options.length = 1024
        }
        // mysql 不支持在 text 类型字段上设置 length
        if (['text', 'mediumtext', 'longtext', 'simple-json', 'simple-array'].includes(options.type as string) && options.length) {
            if (['text', 'mediumtext', 'longtext'].includes(options.type as string)) {
                if (Number(options.length) > 16777215) { // 超过 MEDIUMTEXT 的范围
                    options.type = 'longtext'
                } else if (Number(options.length) > 65535) { // 超过 TEXT 的范围
                    options.type = 'mediumtext'
                } else {
                    options.type = 'text'
                }
            }
            delete options.length
        }
        // mysql 不支持在 simple-json 类型字段上设置 default
        if (['simple-json', 'simple-array'].includes(options.type as string) && typeof options.default !== 'undefined') {
            delete options.default
        }
    } else if (DATABASE_TYPE === 'postgres') { // 处理 PostgreSQL 不兼容的配置
        // postgres 索引最大不超过 8191 字节，在 utf8 编码下不超过 2730 字符
        if (options.index && Number(options.length) > 2730) {
            options.length = 2730
        }
        // postgres 不支持在 text 类型字段上设置 length
        if (['text', 'mediumtext', 'longtext', 'simple-json', 'simple-array'].includes(options.type as string) && options.length) {
            delete options.length
        }
        // postgres 不支持在 simple-json 类型字段上设置 default
        if (['simple-json', 'simple-array'].includes(options.type as string) && typeof options.default !== 'undefined') {
            delete options.default
        }
    }
    length = options.length || length
    if (length) {
        if (['simple-json', 'simple-array'].includes(options.type as string)) { // json 格式的长度限制
            decorators.push(JsonStringLength(0, Number(length)))
        } else {
            decorators.push(Length(0, Number(length)))
        }
    }
    if (options.index) { // 设置索引
        decorators.push(Index({ unique: options.unique }))
    }
    if (options.nullable) { // 如果支持 nullable，则是可选的
        decorators.push(IsOptional())
    } else { // 否则是必选的
        decorators.push(IsNotEmpty())
    }
    decorators.push(Column(options))
    // eslint-disable-next-line @typescript-eslint/ban-types
    // return function (target: object | Function, propertyKey?: string | symbol, descriptor?: any) {
    //     return applyDecorators(
    //         ...decorators,
    //     )(target, propertyKey, descriptor) // 手动调用装饰器
    // }
    return applyDecorators(
        ...decorators,
    )
}
