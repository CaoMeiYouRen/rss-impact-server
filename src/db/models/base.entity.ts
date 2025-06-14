import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert, BeforeUpdate } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import dayjs from 'dayjs'
import { IsOptional, validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { IsId } from '@/decorators/is-id.decorator'
import { flattenValidationErrors } from '@/utils/helper'
import { HttpError } from '@/models/http-error'
import { winstonLogger } from '@/middlewares/logger.middleware'
import { __DEV__, DATABASE_TYPE } from '@/app.config'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

export abstract class Base {

    @SetAclCrudField({
        width: 70,
    })
    @ApiProperty({ title: 'ID', example: 1 })
    @PrimaryGeneratedColumn({ // , 'postgres'
        type: ['mysql'].includes(DATABASE_TYPE) ? 'bigint' : 'integer',
    })
    @IsId()
    @IsOptional()
    id: number

    @SetAclCrudField({
        width: 160,
    })
    @ApiProperty({ title: '创建时间', example: dayjs('2024-01-01').toDate() })
    @Index()
    @CreateDateColumn()
    createdAt: Date

    @SetAclCrudField({
        width: 160,
    })
    @ApiProperty({ title: '更新时间', example: dayjs('2024-01-01').toDate() })
    @Index()
    @UpdateDateColumn()
    updatedAt: Date

    @BeforeInsert()
    protected async insertValidate() {
        const obj = plainToInstance(this.constructor as any, this, {
            enableCircularCheck: true,

        }) as any
        const validationErrors = await validate(obj, {
            whitelist: true,
        })

        const errors = flattenValidationErrors(validationErrors)
        if (errors?.length) {
            __DEV__ && winstonLogger.debug('插入前校验', validationErrors)
            throw new HttpError(400, errors.join(', '))
        }
    }

    @BeforeUpdate()
    protected async updateValidate() {
        const obj = plainToInstance(this.constructor as any, this, {
            enableCircularCheck: true,

        }) as any
        const validationErrors = await validate(obj, {
            whitelist: true,
            skipUndefinedProperties: true,
        })
        const errors = flattenValidationErrors(validationErrors)
        if (errors?.length) {
            __DEV__ && winstonLogger.debug('更新前校验', validationErrors)
            throw new HttpError(400, errors.join(', '))
        }
    }

}
