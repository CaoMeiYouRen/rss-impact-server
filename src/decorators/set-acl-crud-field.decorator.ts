import { SET_ACL_CRUD_FIELD_OPTION } from '@/constant/decorator'
import { Field } from '@/interfaces/avue'

export const SetAclCrudField = (field: Partial<Field>) => (target: unknown, propertyKey: string) => {
    Reflect.defineMetadata(SET_ACL_CRUD_FIELD_OPTION, field, target, propertyKey)
}
