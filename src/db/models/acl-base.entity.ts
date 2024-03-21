import { Column, ManyToOne } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { ValidateIf } from 'class-validator'
import { Base } from './base.entity'
import { User } from './user.entity'
import { IsId } from '@/decorators/is-id.decorator'

export class AclBase extends Base {

    // acl

    @ApiProperty({ description: '所属用户ID', example: 1 })
    @IsId()
    @ValidateIf((o) => typeof o.userId !== 'undefined')
    @Column({ nullable: true })
    userId: number

    @ApiProperty({ description: '所属用户', example: 1, type: () => User })
    @ManyToOne(() => User)
    user: User

}
