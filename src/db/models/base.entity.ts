import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert, BeforeUpdate } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import dayjs from 'dayjs'
import { ValidateIf, validate } from 'class-validator'
import { IsId } from '@/decorators/is-id.decorator'
import { flattenValidationErrors } from '@/utils/helper'
import { HttpError } from '@/models/http-error'

export abstract class Base {

    @ApiProperty({ title: 'ID', example: 1 })
    @PrimaryGeneratedColumn()
    @IsId()
    @ValidateIf((o) => typeof o.id !== 'undefined')
    id: number

    @ApiProperty({ title: '创建时间', example: dayjs('2024-01-01').toDate() })
    @Index()
    @CreateDateColumn()
    createdAt: Date

    @ApiProperty({ title: '更新时间', example: dayjs('2024-01-01').toDate() })
    @Index()
    @UpdateDateColumn()
    updatedAt: Date

    @BeforeInsert()
    protected async insertValidate() { // 插入前校验
        const validationErrors = await validate(this, {
            whitelist: true,
        })
        // console.log('插入前校验', validationErrors)
        const errors = flattenValidationErrors(validationErrors)
        if (errors?.length) {
            throw new HttpError(400, errors.join(', '))
        }
    }

    @BeforeUpdate()
    protected async updateValidate() { // 更新前校验
        const validationErrors = await validate(this, {
            whitelist: true,
            skipMissingProperties: true, // 忽略 null 和 undefined
            // skipUndefinedProperties: true, // 只忽略 undefined ，如果是 null 的话就会将字段设置为空
        })
        // console.log('更新前校验', validationErrors)
        const errors = flattenValidationErrors(validationErrors)
        if (errors?.length) {
            throw new HttpError(400, errors.join(', '))
        }
    }

}
