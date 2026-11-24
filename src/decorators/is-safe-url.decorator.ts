import { isURL, registerDecorator, ValidationOptions } from 'class-validator'
import { IsURLOptions } from 'validator'
import { isSafeHttpUrl } from '@/utils/ssrf-guard'

/**
 * 校验 URL 格式与出站安全性。
 *
 * 仅允许 http/https，禁止 URL 内嵌凭据，并默认拒绝私网、回环、链路本地与云元数据地址。
 * 域名解析结果由请求阶段的 SSRF 守卫负责校验。
 *
 * @author CaoMeiYouRen
 * @date 2026-11-24
 */
export function IsSafeUrl(options: IsURLOptions = {}, validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string) {
        registerDecorator({
            name: 'isSafeUrl',
            target: object?.constructor,
            propertyName,
            options: validationOptions,
            constraints: [options],
            validator: {
                validate(value: any, args) {
                    if (typeof value !== 'string') {
                        return false
                    }
                    const [urlOptions] = args.constraints as [IsURLOptions]
                    const urlValid = isURL(value, {
                        require_protocol: true,
                        protocols: ['http', 'https'],
                        disallow_auth: true,
                        ...urlOptions,
                    })
                    return urlValid && isSafeHttpUrl(value)
                },
                defaultMessage(args) {
                    return `${args.property} must be a safe http/https URL`
                },
            },
        })
    }
}
