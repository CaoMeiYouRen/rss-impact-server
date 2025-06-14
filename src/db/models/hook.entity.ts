import { BeforeInsert, BeforeUpdate, Entity, ManyToMany, ManyToOne } from 'typeorm'
import { ApiExtraModels, ApiProperty, getSchemaPath, OmitType, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsObject, ValidateNested, IsIn, validate, IsDefined } from 'class-validator'
import { plainToInstance, Type } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'
import { ProxyConfig } from './proxy-config.entity'
import { HookList, HookType } from '@/constant/hook'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { HookConfig } from '@/interfaces/hook'
import { NotificationConfig } from '@/models/notification-config'
import { WebhookConfig } from '@/models/webhook-config'
import { DownloadConfig } from '@/models/download-config'
import { BitTorrentConfig } from '@/models/bit-torrent-config'
import { initAvueCrudColumn } from '@/decorators/acl-crud.decorator'
import { IsId } from '@/decorators/is-id.decorator'
import { AIConfig } from '@/models/ai-config'
import { RegularConfig } from '@/models/regular-config'
import { winstonLogger } from '@/middlewares/logger.middleware'
import { HttpError } from '@/models/http-error'
import { flattenValidationErrors } from '@/utils/helper'
import { __DEV__ } from '@/app.config'
import { Filter } from '@/models/filter.dto'
import { FilterOut } from '@/models/filter-out.dto'
import { CustomColumn } from '@/decorators/custom-column.decorator'

// eslint-disable-next-line @typescript-eslint/ban-types
const hookConfig: Record<HookType, Function> = {
    notification: NotificationConfig,
    webhook: WebhookConfig,
    download: DownloadConfig,
    bitTorrent: BitTorrentConfig,
    aiSummary: AIConfig,
    regular: RegularConfig,
}

@ApiExtraModels(...Object.values(hookConfig))
@Entity()
export class Hook extends AclBase {

    @ApiProperty({ title: '名称', example: 'Hook1' })
    @CustomColumn({
        index: true,
        length: 256,
    })
    name: string

    @SetAclCrudField({
        type: 'select',
        search: true,
        dicData: HookList,
    })
    @ApiProperty({ title: '类型', example: 'webhook', type: () => String })
    @IsIn(HookList.map((e) => e.value))
    @CustomColumn({
        length: 128,
        type: 'varchar',
    })
    type: HookType

    @SetAclCrudField({
        component: 'CrudForm',
        span: 24,
        params: {
            dynamicOption: Object.entries(hookConfig).map(([key, value]) => ({
                optionId: key,
                submitBtn: false,
                emptyBtn: false,
                column: initAvueCrudColumn(value),
            })),
            value: '{}',
        },
        // value: '{}',
    })
    @ApiProperty({
        title: '配置',
        example: {},
        oneOf: [
            ...Object.values(hookConfig).map((e) => ({ $ref: getSchemaPath(e) })),
        ],
    })
    @IsObject()
    @IsDefined()
    @CustomColumn({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    config: HookConfig

    @BeforeInsert()
    @BeforeUpdate()
    protected async insertConfigValidate() { // 插入/更新前校验
        const obj: HookConfig = plainToInstance(hookConfig[this.type] as any, this.config, {
            enableCircularCheck: true,

        })
        const validationErrors = await validate(obj, {
            whitelist: true,
            skipUndefinedProperties: true, // 忽略 undefined。如果是 undefined ，表明该字段没有更新
        })
        const errors = flattenValidationErrors(validationErrors)
        if (errors?.length) {
            __DEV__ && winstonLogger.debug('插入/更新前校验', validationErrors)
            throw new HttpError(400, errors.join(', '))
        }
        __DEV__ && winstonLogger.debug('通过插入/更新前校验', JSON.stringify(this.config, null, 4))
    }

    @SetAclCrudField({
        // type: 'textarea',
    })
    @ApiProperty({ title: '过滤条件', description: '保留想要的内容，必须符合全部条件才保留。支持通过正则表达式过滤。留空的规则不会过滤。', type: Filter })
    @Type(() => Filter)
    @ValidateNested()
    @IsObject()
    @IsDefined()
    @CustomColumn({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    filter: Filter

    @SetAclCrudField({
        // type: 'textarea',
    })
    @ApiProperty({ title: '排除条件', description: '去掉不要的内容，有一个条件符合就排除。支持通过正则表达式排除。留空的规则不会排除。', type: FilterOut })
    @Type(() => FilterOut)
    @ValidateNested()
    @IsObject()
    @IsDefined()
    @CustomColumn({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    filterout: FilterOut

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '反转模式', description: '如果服务可访问，则认为是故障', example: false })
    @IsBoolean()
    @CustomColumn({
        default: false,
    })
    isReversed: boolean

    // @SetAclCrudField({
    //     labelWidth: 105,
    // })
    // @ApiProperty({ title: '触发次数上限', description: '当一小时内触发次数超过该数字，则停止触发该 Hook。推荐在推送Hook中设置。默认为 0(无限制)，即每次都触发', example: 20 })
    // @IsSafeNaturalNumber()
    // @IsOptional()
    // @Column({
    //     nullable: true,
    //     default: 0,
    // })
    // triggerLimit?: number

    // @SetAclCrudField({
    //     labelWidth: 116,
    // })
    // @ApiProperty({ title: '反转触发下限', description: '当一小时内该路由报错次数大于该数字，才反转触发 Hook。默认为 0(无限制)，即每次都触发', example: 3 })
    // @IsSafeNaturalNumber()
    // @IsOptional()
    // @Column({
    //     nullable: true,
    //     default: 0,
    // })
    // reverseLimit?: number

    @SetAclCrudField({
        search: true,
        dicUrl: '/proxy-config/dicData',
        props: {
            label: 'name',
            value: 'id',
        },
        value: null,
    })
    @ApiProperty({ title: '代理配置', description: '选择不代理后保存即可禁用代理', example: 1 })
    @IsId()
    @CustomColumn({ type: 'bigint', nullable: true })
    proxyConfigId?: number

    @SetAclCrudField({
        hide: true,
    })
    @ApiProperty({ title: '代理配置', type: () => ProxyConfig })
    @ManyToOne(() => ProxyConfig)
    proxyConfig?: ProxyConfig

    @SetAclCrudField({
        hide: true,
    })
    @ApiProperty({ title: '订阅源列表', example: [], type: () => [Feed] })
    @ManyToMany(() => Feed, (feed) => feed.hooks)
    feeds: Feed[]

}

export class CreateHook extends OmitType(Hook, ['id', 'createdAt', 'updatedAt'] as const) { }

export class UpdateHook extends PartialType(OmitType(Hook, ['createdAt', 'updatedAt'] as const)) { }

export class FindHook extends FindPlaceholderDto<Hook> {
    @ApiProperty({ type: () => [Hook] })
    declare data: Hook[]
}
