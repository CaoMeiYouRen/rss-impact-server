import { get, merge, union } from 'lodash'
import { PARAMTYPES_METADATA } from '@nestjs/common/constants'
import dayjs from 'dayjs'
import { AvueCrudConfig, CrudOptionsWithModel, Field } from '@/interfaces/avue'
import { AclCrudController } from '@/controllers/acl-crud/acl-crud.controller'
import { SET_ACL_CRUD_FIELD_OPTION } from '@/constant/decorator'

const CRUD_ROUTES = {
    // dicData: 'dicData',
    config: 'config',
    find: 'find',
    findOne: 'findOne',
    create: 'create',
    update: 'update',
    delete: 'delete',
}
const allMethods = Object.values(CRUD_ROUTES)

interface AclOptions extends CrudOptionsWithModel {
}

class CrudPlaceholderDto {
    fake?: string
}

function cloneDecorators(from: unknown, to: unknown) {
    Reflect.getMetadataKeys(from).forEach((key) => {
        const value = Reflect.getMetadata(key, from)
        Reflect.defineMetadata(key, value, to)
    })
}
function clonePropDecorators(from: unknown, to: unknown, name: string | symbol) {
    Reflect.getMetadataKeys(from, name).forEach((key) => {
        const value = Reflect.getMetadata(key, from, name)
        Reflect.defineMetadata(key, value, to, name)
    })
}

function initAvueCrudConfig(instance: any, config: AvueCrudConfig = {}): AvueCrudConfig {
    const obj = instance
    if (!Reflect.getMetadata('typegoose:properties', obj)) {
        return config
    }
    const typegooseProperties = Array.from(Reflect.getMetadata('typegoose:properties', obj) as Map<string, any>)
    const swaggerProperties = Reflect.getMetadata('swagger/apiModelPropertiesArray', obj) as string[]
    if (!typegooseProperties) {
        return config
    }
    if (!swaggerProperties) {
        return config
    }
    const protectFields = ['id', 'createdAt', 'updatedAt'] // 保护字段，由系统自动生成，无法修改
    const properties = union(swaggerProperties.map((e) => e.replace(':', '')), typegooseProperties.map((e) => e[0]))
    // console.log('properties', properties)
    const dbColumn: Field[] = properties.map((prop) => {
        const item = typegooseProperties.find(([key]) => key === prop)?.[1]
        const setAclCrudFieldOption: Field = Reflect.getMetadata(SET_ACL_CRUD_FIELD_OPTION, obj, prop)
        const swaggerOption = Reflect.getMetadata('swagger/apiModelProperties', obj, prop)
        const propType = Reflect.getMetadata('design:type', obj, prop)?.name
        let type = 'input'
        let format: string
        let value: any = item?.options?.default
        let extra: any = {}
        let label = swaggerOption?.title || swaggerOption?.description || prop
        if (item?.options?.select === false) {
            extra = {
                hide: true,
                ...extra,
            }
        }
        switch (propType) {
            case 'String':
                type = 'input'
                value = typeof value === 'undefined' ? '' : value
                extra = {
                    maxlength: item?.options?.maxlength ?? 1024,
                    minlength: item?.options?.minlength ?? 0,
                    ...extra,
                }
                break
            case 'Number':
                type = 'number'
                value = typeof value === 'undefined' ? 0 : value
                extra = {
                    max: item?.options?.max ?? Number.MAX_SAFE_INTEGER,
                    min: item?.options?.min ?? 0,
                    ...extra,
                }
                break
            case 'Boolean':
                type = 'switch'
                value = typeof value === 'undefined' ? false : value
                break
            case 'Date':
                type = 'datetime'
                format = 'yyyy-MM-dd HH:mm:ss.SSS'
                value = typeof value === 'undefined' ? dayjs().toDate() : value
                break
            case 'Array':
                type = 'array'
                value = typeof value === 'undefined' ? [] : value
                break
            case 'Object':
                type = 'textarea'
                value = typeof value === 'undefined' ? {} : value
                break
            default:
                type = 'input'
                value = typeof value === 'undefined' ? '' : value
                break
        }
        if (typeof value !== 'undefined' && ['Array', 'Object'].includes(propType) && (Array.isArray(value) || typeof value === 'object')) {
            value = JSON.stringify(value)
        }
        if (protectFields.includes(prop)) {
            extra = {
                addDisplay: false,
                editDisabled: true,
                readonly: true,
                ...extra,
            }
        }
        if (prop === 'user') {
            extra = {
                label: '所属用户',
                type: 'select',
                dicUrl: '/user/dicData',
                value: '',
                ...extra,
            }
        } else if (prop === 'createdAt') {
            label = '创建时间'
        } else if (prop === 'updatedAt') {
            label = '更新时间'
        }
        return {
            label,
            prop,
            type: type as any,
            overHidden: true,
            format,
            value,
            ...extra,
            ...setAclCrudFieldOption,
        }
    })
    const column: Field[] = merge([], dbColumn, config?.option?.column)
    column.unshift({
        label: 'Id',
        prop: 'id',
        addDisplay: false,
        editDisabled: true,
        overHidden: true,
    })
    const defaultOption = {
        // title: '',
        index: false,
        align: 'center',
        border: true,
        stripe: true,
        columnBtn: true,
        refreshBtn: true,
        addBtn: true,
        editBtn: true,
        delBtn: true,
        viewBtn: true,
        excelBtn: true,
    }
    const newConfig = {
        option: merge({}, defaultOption, config?.option, { column }),
    }
    return newConfig
}

export const AclCrud = (options: AclOptions): ClassDecorator => (target) => { // target就是目标class
    const Controller = target
    const controller = target.prototype
    const crudController = new AclCrudController(options.model)
    const methods = allMethods.filter((v) => get(options, `routes.${v}`) !== false)

    for (const method of methods) {
        if (controller[method]) {
            continue
        }
        // TODO 迁移 typegoose 到 typeorm
        // if (method === CRUD_ROUTES.config) {
        //     Object.defineProperty(controller, '__AVUE_CRUD_CONFIG__', {
        //         value: initAvueCrudConfig(options?.model?.prototype, options?.config),
        //     })
        //     // continue
        // }
        controller[method] = function test(...args: any[]) {
            return crudController[method].apply(this, args)
        }
        Object.defineProperty(controller[method], 'name', {
            value: method,
        })
        // clone instance decorators
        cloneDecorators(crudController, controller)
        cloneDecorators(crudController[method], controller[method])
        // clone instance method decorators
        clonePropDecorators(crudController, controller, method)
        // clone class "method" decorators
        clonePropDecorators(AclCrudController, Controller, method)

        // get exists param types
        const types: [] = Reflect.getMetadata(PARAMTYPES_METADATA, controller, method)

        Reflect.decorate([
            // replace fake dto to real dto
            Reflect.metadata(PARAMTYPES_METADATA, types.map((v: any) => {
                if (get(v, 'name') === CrudPlaceholderDto.name) {
                    return get(options, `routes.${method}.dto`, options.model)
                }
                return v
            })),
            ...get(options, `routes.${method}.decorators`, []),
        ], controller, method, Object.getOwnPropertyDescriptor(controller, method))

    }
}
