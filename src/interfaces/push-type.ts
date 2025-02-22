import { PushType, MetaPushConfig, PushAllInOne } from 'push-all-in-one'

export const PushTypeMap: Record<PushType, string> = Object.fromEntries(Object.entries(PushAllInOne).map(([key, value]) => [key as any, value.namespace]))

export const PushTypeList = Object.entries(PushTypeMap).map(([value, label]) => ({
    label,
    value,
}))

export { MetaPushConfig, PushType }

