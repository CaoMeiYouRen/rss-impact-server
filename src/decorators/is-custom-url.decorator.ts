import { applyDecorators } from '@nestjs/common'
import { IsUrl, ValidationOptions } from 'class-validator'
import { IsURLOptions } from 'validator'
import { __PROD__ } from '@/app.config'

export function IsCustomURL(options: IsURLOptions = {}, validationOptions?: ValidationOptions) {
    return applyDecorators(IsUrl({
        require_tld: __PROD__,   // 是否要顶级域名
        ...options,
    }, validationOptions))
}
