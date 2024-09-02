import { ManyToOne } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Base } from './base.entity'
import { User } from './user.entity'
import { IsId } from '@/decorators/is-id.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { CustomColumn } from '@/decorators/custom-column.decorator'

export abstract class AclBase extends Base {

    // acl

    @SetAclCrudField({
        dicUrl: '/user/dicData',
        search: true,
    })
    @ApiProperty({ title: '所属用户', example: 1 })
    @IsId()
    @CustomColumn({ nullable: true })
    userId: number

    @SetAclCrudField({
        hide: true,
    })
    @ApiProperty({ title: '所属用户', type: () => User })
    @ManyToOne(() => User)
    user: User

}
