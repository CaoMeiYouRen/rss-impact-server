import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import dayjs from 'dayjs'
import { ValidateIf } from 'class-validator'
import { IsId } from '@/decorators/is-id.decorator'

export abstract class Base {

    @ApiProperty({ title: 'ID', example: 1 })
    @PrimaryGeneratedColumn()
    @IsId()
    @ValidateIf((o) => typeof o.id !== 'undefined')
    id: number

    @ApiProperty({ title: '创建时间', example: dayjs().toDate() })
    @Index()
    @CreateDateColumn()
    createdAt: Date

    @ApiProperty({ title: '更新时间', example: dayjs().toDate() })
    @Index()
    @UpdateDateColumn()
    updatedAt: Date

}
