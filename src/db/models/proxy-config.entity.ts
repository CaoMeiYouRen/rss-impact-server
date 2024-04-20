import { Column, Entity, Index } from 'typeorm'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsNotEmpty, Length } from 'class-validator'
import { AclBase } from './acl-base.entity'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { __DEV__ } from '@/app.config'
import { IsHttpHttpsSocksSocks5Url } from '@/decorators/is-http-https-socks-socks5-url.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'

/**
 * 代理配置
 *
 * @author CaoMeiYouRen
 * @date 2024-04-20
 * @export
 * @class ProxyConfig
 */
@Entity()
export class ProxyConfig extends AclBase {

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '代理名称', example: '代理A' })
    @IsNotEmpty({})
    @Length(0, 256, {})
    @Index({})
    @Column({
        length: 256,
    })
    name: string

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '代理URL', description: '支持 http/https/socks/socks5 协议。例如 http://127.0.0.1:8080', example: 'http://127.0.0.1:8080' })
    @IsNotEmpty({})
    @IsHttpHttpsSocksSocks5Url({}, {
        require_tld: !__DEV__, // 是否要顶级域名
    })
    @Length(0, 2048, {})
    @Index({})
    @Column({
        length: 2048,
    })
    url: string

}

export class CreateProxyConfig extends OmitType(ProxyConfig, ['id', 'createdAt', 'updatedAt'] as const) { }

export class UpdateProxyConfig extends PartialType(OmitType(ProxyConfig, ['createdAt', 'updatedAt'] as const)) { }

export class FindProxyConfig extends FindPlaceholderDto<ProxyConfig> {
    @ApiProperty({ type: () => [ProxyConfig] })
    declare data: ProxyConfig[]
}
