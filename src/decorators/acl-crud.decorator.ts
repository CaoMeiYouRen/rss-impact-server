import { get, merge, union, upperFirst } from 'lodash'
import { PARAMTYPES_METADATA } from '@nestjs/common/constants'
import dayjs from 'dayjs'
import { Logger } from '@nestjs/common'
import { FindOneOptions, FindOptionsOrder, getMetadataArgsStorage } from 'typeorm'
import { getMetadataStorage, ValidationTypes } from 'class-validator'
import { Props } from '@cao-mei-you-ren/avue-types'
import { AvueCrudConfig, CrudOptionsWithModel, Field } from '@/interfaces/avue'
import { AclCrudController } from '@/controllers/acl-crud/acl-crud.controller'
import { IS_ID, SET_ACL_CRUD_FIELD_OPTION } from '@/constant/decorator'
import { CrudPlaceholderDto } from '@/models/crud-placeholder.dto'
import { isImageUrl } from '@/utils/helper'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'

const CRUD_ROUTES = {
    dicData: 'dicData',
    config: 'config',
    find: 'find',
    findOne: 'findOne',
    create: 'create',
    update: 'update',
    delete: 'delete',
}
const allMethods = Object.values(CRUD_ROUTES)

export interface AclOptions extends CrudOptionsWithModel, FindOneOptions {
    relations?: string[]
    order?: FindOptionsOrder<any>
    props?: Props
    select?: string[]
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
// eslint-disable-next-line @typescript-eslint/ban-types
interface TFunction extends Function { }

export function initAvueCrudColumn(clazz: TFunction): Field[] {
    const prototype = clazz.prototype
    const metadata = getMetadataArgsStorage()
    const metadataStorage = getMetadataStorage()
    const validatorProperties = metadataStorage.getTargetValidationMetadatas(clazz, clazz.name, true, false)
    const typeormProperties = metadata.filterColumns(clazz)
    const swaggerProperties = Reflect.getMetadata('swagger/apiModelPropertiesArray', prototype) as string[]
    if (!typeormProperties) {
        return []
    }
    if (!swaggerProperties) {
        return []
    }
    const protectFields = ['id', 'createdAt', 'updatedAt'] // 保护字段，由系统自动生成，无法修改
    const properties = union(swaggerProperties.map((e) => e.replace(':', '')), typeormProperties.map((e) => e.propertyName), validatorProperties.map((e) => e.propertyName))
    if (!properties?.length) {
        return []
    }
    const dbColumn: Field[] = properties.map((prop) => {
        const options = typeormProperties.find((e) => e.propertyName === prop)?.options
        const validatorOptions = validatorProperties.filter((e) => e.propertyName === prop)

        const setAclCrudFieldOption: Field = Reflect.getMetadata(SET_ACL_CRUD_FIELD_OPTION, prototype, prop)
        const swaggerOption = Reflect.getMetadata('swagger/apiModelProperties', prototype, prop)
        const Clazz = Reflect.getMetadata('design:type', prototype, prop)
        const propType = Clazz?.name
        let type = 'input'
        let format: string
        let value: any = options?.default
        let extra: any = {
            ...setAclCrudFieldOption,
            nullable: options?.nullable ?? validatorOptions.some((e) => e.type === ValidationTypes.CONDITIONAL_VALIDATION), // 如果 nullable ，或者是 可选的
            minWidth: 100,
            isId: Reflect.getMetadata(IS_ID, prototype, prop),
        }
        const label = swaggerOption?.title || upperFirst(prop)
        const tip = swaggerOption?.description
        if (tip) {
            extra.tip = tip
        }
        switch (propType) {
            case 'String': {
                const lengthOption = validatorOptions.find((e) => ['isLength', 'jsonStringLength'].includes(e.name))
                type = options?.type === 'text' ? 'textarea' : 'input'
                value = typeof value === 'undefined' ? '' : value
                extra = {
                    maxlength: options?.length ?? lengthOption?.constraints?.[1] ?? 2048,
                    minlength: lengthOption?.constraints?.[0] ?? 0,
                    ...extra,
                }
                break
            }
            case 'Number': {
                const maxOption = validatorOptions.find((e) => e.name === 'max')
                const minOption = validatorOptions.find((e) => e.name === 'min')
                type = 'number'
                value = typeof value === 'undefined' ? 0 : value
                extra = {
                    max: maxOption?.constraints?.[0] ?? Number.MAX_SAFE_INTEGER,
                    min: minOption?.constraints?.[0] ?? 0,
                    ...extra,
                }
                break
            }
            case 'Boolean':
                type = 'switch'
                value = typeof value === 'undefined' ? false : value
                extra = {
                    dicData: [
                        {
                            label: 'false',
                            value: false,
                        },
                        {
                            label: 'true',
                            value: true,
                        },
                    ],
                    ...extra,
                }
                break
            case 'Date':
                type = 'datetime'
                format = 'YYYY-MM-DD HH:mm:ss'
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
            case 'Filter':
            case 'FilterOut':
            case 'EnclosureImpl':
                extra = {
                    span: 24,
                    // type: 'textarea',
                    component: 'CrudForm',
                    params: {
                        option: {
                            submitBtn: false,
                            emptyBtn: false,
                            column: initAvueCrudColumn(Clazz),
                        },
                        // defaultValue: '{}',
                        value: typeof value === 'undefined' ? '{}' : value,
                    },
                    ...extra,
                }
                value = typeof value === 'undefined' ? {} : value
                break
            default:
                type = 'input'
                value = typeof value === 'undefined' ? '' : value
                break
        }
        extra.type = type
        if (protectFields.includes(prop)) {
            extra = {
                addDisplay: false,
                editDisabled: true,
                readonly: true,
                ...extra,
            }
        }
        if (options?.select === false) {
            extra = {
                hide: true,
                ...extra,
            }
        }
        let rules: any[]
        // 如果有 isDefined/isNotEmpty 则为必填
        if (validatorOptions.some((e) => e.name === 'isDefined' || e.name === 'isNotEmpty')) {
            rules = [
                {
                    required: true,
                    message: `请输入${label}`,
                    trigger: 'blur',
                },
            ]
        }
        // 如果有 isUrl 则为 url
        if (validatorOptions.some((e) => e.name === 'isUrl')) {
            extra.type = 'url' // url 默认为数组
            if (isImageUrl(Array.isArray(swaggerOption.example) ? swaggerOption.example[0] : swaggerOption.example)) { // 如果 example 是图片，则设置为 img
                extra.type = 'img'
            }
            if (propType === 'String') {
                extra.alone = true // 单个超链接/图片
            }
        }
        if (setAclCrudFieldOption?.dicUrl || Array.isArray(setAclCrudFieldOption?.dicData)) { // 如果有 dicData 或 dicUrl，就设置为 select
            extra.type = 'select'
        }

        if (extra?.hide || setAclCrudFieldOption?.hide) {
            extra = {
                addDisplay: false,
                editDisabled: true,
                editDisplay: false,
                viewDisplay: false,
                readonly: true,
                ...extra,
            }
        }
        // 如果为 select/CrudForm 则不转换
        if (['textarea', 'input'].includes(extra.type) && extra?.component !== 'CrudForm' && typeof value !== 'undefined' && (Array.isArray(value) || typeof value === 'object')) {
            value = JSON.stringify(value)
        }
        return {
            label,
            prop,
            type: type as any,
            overHidden: true,
            format,
            value,
            rules,
            ...extra,
            ...setAclCrudFieldOption,
        }
    })
    return dbColumn.filter((e) => !e.hide) // 过滤 hide 字段
}

function initAvueCrudConfig(aclOptions: AclOptions): AvueCrudConfig {
    const clazz = aclOptions?.model
    const config = aclOptions?.config as AvueCrudConfig
    const prototype = aclOptions?.model?.prototype
    const metadata = getMetadataArgsStorage()

    const typeormProperties = metadata.filterColumns(clazz)
    const swaggerProperties = Reflect.getMetadata('swagger/apiModelPropertiesArray', prototype) as string[]
    if (!typeormProperties) {
        return config
    }
    if (!swaggerProperties) {
        return config
    }

    const dbColumn: Field[] = initAvueCrudColumn(clazz)
    let column: Field[] = merge([], dbColumn, config?.option?.column)

    // 找到 updatedAt 和 createdAt 对应的列对象
    const updatedAtColumn = column.find((col) => col.prop === 'updatedAt')
    if (updatedAtColumn && aclOptions?.routes?.update) { // 如果允许 update 则 updatedAt 也可以查询
        updatedAtColumn.search = true
        updatedAtColumn.searchRange = true
    }
    const createdAtColumn = column.find((col) => col.prop === 'createdAt')
    if (createdAtColumn) {
        createdAtColumn.search = true
        createdAtColumn.searchRange = true
    }

    // 从原数组中移除这两个列对象
    column = column.filter((col) => col.prop !== 'updatedAt' && col.prop !== 'createdAt')

    // 将它们添加到数组末尾
    column.push(createdAtColumn, updatedAtColumn)

    const defaultOption = {
        title: '',
        index: false,
        align: 'center',
        border: true,
        stripe: true,
        columnBtn: true,
        refreshBtn: true,
        addBtn: aclOptions?.routes?.create !== false,
        editBtn: aclOptions?.routes?.update !== false,
        delBtn: aclOptions?.routes?.delete !== false,
        viewBtn: aclOptions?.routes?.find !== false,
        excelBtn: true,
        gridBtn: false,
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
    if (!controller.logger) {
        Object.defineProperty(controller, 'logger', {
            value: new Logger(target.name),
            writable: false, // 只读
        })
    }
    if (!controller.__OPTIONS__) {
        Object.defineProperty(controller, '__OPTIONS__', {
            value: options,
            writable: false, // 只读
        })
    }
    if (!controller.__AVUE_CRUD_CONFIG__) {
        Object.defineProperty(controller, '__AVUE_CRUD_CONFIG__', {
            value: initAvueCrudConfig(options),
            writable: false, // 只读
        })
    }
    for (const method of methods) {
        if (controller[method]) {
            continue
        }
        if (method === 'dicData' && !options?.props) {
            continue
        }
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

        // 解决 swagger response 问题
        const apiResponse: Record<string, any> = Reflect.getMetadata('swagger/apiResponse', crudController[method])
        if (apiResponse) {
            // console.log(apiResponse)
            // replace fake dto to real dto
            Reflect.defineMetadata('swagger/apiResponse', Object.fromEntries(Object.entries(apiResponse).map(([key, value]) => {
                if (!value?.type) {
                    return [key, value]
                }
                if (value?.type?.name === FindPlaceholderDto.name) {
                    // const raw = Reflect.getMetadata('swagger/apiModelProperties', value.type.prototype, 'data')
                    // Reflect.defineMetadata('swagger/apiModelProperties', {
                    //     ...raw,
                    //     type: [options.model],
                    // }, value.type.prototype)
                    return [key, {
                        ...value,
                        type: get(options, `routes.${method}.dto`, value?.type),
                    }]
                }
                if (value?.type?.name === CrudPlaceholderDto.name) {
                    return [key, {
                        ...value,
                        type: options.model,
                    }]
                }
                // console.log(Controller.name, method, value?.type?.name, options.model.name, value?.type?.name === options.model.name)
                return [key, value]
            })), controller[method])

        }
    }
}
