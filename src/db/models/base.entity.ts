import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert, BeforeUpdate } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import dayjs from 'dayjs'
import { IsOptional, validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { IsId } from '@/decorators/is-id.decorator'
import { flattenValidationErrors } from '@/utils/helper'
import { HttpError } from '@/models/http-error'
import { winstonLogger } from '@/middlewares/logger.middleware'

export abstract class Base {

    @ApiProperty({ title: 'ID', example: 1 })
    @PrimaryGeneratedColumn()
    @IsId()
    @IsOptional()
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
        const obj = plainToInstance(this.constructor as any, this) as any // 解决 部分情况下子字段无法校验的问题
        const validationErrors = await validate(obj, {
            whitelist: true,
        })

        const errors = flattenValidationErrors(validationErrors)
        if (errors?.length) {
            winstonLogger.debug('插入前校验', validationErrors)
            throw new HttpError(400, errors.join(', '))
        }
    }

    @BeforeUpdate()
    protected async updateValidate() { // 更新前校验
        const obj = plainToInstance(this.constructor as any, this) as any // 解决 部分情况下子字段无法校验的问题
        const validationErrors = await validate(obj, {
            whitelist: true,
            skipMissingProperties: true, // 忽略 null 和 undefined
            // skipUndefinedProperties: true, // 只忽略 undefined ，如果是 null 的话就会将字段设置为空
        })
        const errors = flattenValidationErrors(validationErrors)
        if (errors?.length) {
            winstonLogger.debug('更新前校验', validationErrors)
            throw new HttpError(400, errors.join(', '))
        }
    }

}
