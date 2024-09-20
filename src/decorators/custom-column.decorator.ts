import { applyDecorators } from '@nestjs/common'
import { Column, ColumnOptions, Index } from 'typeorm'
import { IsNotEmpty, IsOptional, Length } from 'class-validator'
import { JsonStringLength } from './json-string-length.decorator'
import { DATABASE_INDEX_LENGTH, DATABASE_TYPE } from '@/app.config'

export function CustomColumn(options: ColumnOptions & { index?: boolean }) {
    const decorators: PropertyDecorator[] = []

    let length = options.length
    if (DATABASE_TYPE === 'sqlite') { // 处理 sqlite 不兼容的配置
        // sqlite AUTOINCREMENT 仅支持 integer 类型，所以 id 设置为 integer
        if (options.type === 'bigint') {
            options.type = 'integer'
        }
    } else if (DATABASE_TYPE === 'mysql') { // 处理 MySQL 不兼容的配置
        // mysql 索引最大不超过 3072 字节，在 utf8 编码下不超过 1024 字符，utf8mb4 编码不超过 768 字符
        if (options.index && Number(options.length) > DATABASE_INDEX_LENGTH) {
            options.length = DATABASE_INDEX_LENGTH
        }
        // mysql 不支持在 text 类型字段上设置 length
        if (['text', 'mediumtext', 'longtext', 'simple-json', 'simple-array'].includes(options.type as string) && options.length) {
            if (['text', 'mediumtext', 'longtext'].includes(options.type as string)) {
                if (Number(options.length) > 5592405) { // 超过 MEDIUMTEXT 的范围。 16777215 B，5592405 个字符
                    options.type = 'longtext'
                } else if (Number(options.length) > 21845) { // 超过 TEXT 的范围。 65535 B，21845 个字符
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
        // postgres 的 bigserial 类型的 id 在插入时返回的是 string 类型，存在 bug，所以设置为 integer
        if (options.type === 'bigint') {
            options.type = 'integer'
        }
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
        delete options.index
        if (options.unique) {
            delete options.unique
        }
    }
    if (options.nullable) { // 如果支持 nullable，则是可选的
        decorators.push(IsOptional())
    } else { // 否则是必选的
        decorators.push(IsNotEmpty())
    }
    decorators.push(Column(options))
    return applyDecorators(
        ...decorators,
    )
}
