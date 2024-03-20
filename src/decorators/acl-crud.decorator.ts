import { get, merge, union, upperFirst } from 'lodash'
import { PARAMTYPES_METADATA } from '@nestjs/common/constants'
import dayjs from 'dayjs'
import { Logger } from '@nestjs/common'
import { getMetadataArgsStorage } from 'typeorm'
import { getMetadataStorage } from 'class-validator'
import { AvueCrudConfig, CrudOptionsWithModel, Field } from '@/interfaces/avue'
import { AclCrudController } from '@/controllers/acl-crud/acl-crud.controller'
import { SET_ACL_CRUD_FIELD_OPTION } from '@/constant/decorator'
import { CrudPlaceholderDto } from '@/models/crud-placeholder.dto'
import { isImageUrl } from '@/utils/helper'

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

export interface AclOptions extends CrudOptionsWithModel {
    relations?: string[]
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

function initAvueCrudConfig(instance: any, clazz: any, config: AvueCrudConfig = {}): AvueCrudConfig {
    const obj = instance
    const metadata = getMetadataArgsStorage()
    const metadataStorage = getMetadataStorage()
    // console.log(clazz.name, clazz)
    // console.log(metadataStorage)
    const validatorProperties = metadataStorage.getTargetValidationMetadatas(clazz, clazz.name, true, false)
    const typeormProperties = metadata.filterColumns(clazz)
    const swaggerProperties = Reflect.getMetadata('swagger/apiModelPropertiesArray', obj) as string[]
    if (!typeormProperties) {
        return config
    }
    if (!swaggerProperties) {
        return config
    }
    const protectFields = ['id', 'createdAt', 'updatedAt'] // 保护字段，由系统自动生成，无法修改
    const properties = union(swaggerProperties.map((e) => e.replace(':', '')), typeormProperties.map((e) => e.propertyName), validatorProperties.map((e) => e.propertyName))
    // console.log('properties', properties)

    const dbColumn: Field[] = properties.map((prop) => {
        const options = typeormProperties.find((e) => e.propertyName === prop)?.options
        const validatorOptions = validatorProperties.filter((e) => e.propertyName === prop)
        // console.log(validatorOptions)
        const setAclCrudFieldOption: Field = Reflect.getMetadata(SET_ACL_CRUD_FIELD_OPTION, obj, prop)
        const swaggerOption = Reflect.getMetadata('swagger/apiModelProperties', obj, prop)
        const propType = Reflect.getMetadata('design:type', obj, prop)?.name
        let type = 'input'
        let format: string
        let value: any = options?.default
        let extra: any = {}
        const label = swaggerOption?.title || swaggerOption?.description || upperFirst(prop)
        // console.log(swaggerOption)
        switch (propType) {
            case 'String': {
                const lengthOption = validatorOptions.find((e) => e.name === 'isLength')
                type = 'input'
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
        if (options?.select === false) {
            extra = {
                hide: true,
                ...extra,
            }
        }
        // if (prop === 'user') {
        //     extra = {
        //         label: '所属用户',
        //         type: 'select',
        //         dicUrl: '/user/dicData',
        //         value: '',
        //         ...extra,
        //     }
        // }
        let rules: any[]
        // 如果有 isNotEmpty 则为必填
        if (validatorOptions.find((e) => e.name === 'isNotEmpty')) {
            rules = [
                {
                    required: true,
                    message: `请输入${label}`,
                    trigger: 'blur',
                },
            ]
        }
        // 如果有 isUrl 则为 url
        if (validatorOptions.find((e) => e.name === 'isUrl')) {
            extra.type = 'url'
            if (isImageUrl(Array.isArray(swaggerOption.example) ? swaggerOption.example[0] : swaggerOption.example)) { // 如果 example 是图片，则设置为 img
                extra.type = 'img'
            }
            if (propType === 'String') {
                extra.alone = true // 单个超链接/图片
            }
        }

        // else if (prop === 'createdAt') {
        //     label = '创建时间'
        // } else if (prop === 'updatedAt') {
        //     label = '更新时间'
        // }
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
    const column: Field[] = merge([], dbColumn, config?.option?.column)
    // column.unshift({
    //     label: 'Id',
    //     prop: 'id',
    //     addDisplay: false,
    //     editDisabled: true,
    //     overHidden: true,
    // })
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
            value: initAvueCrudConfig(options?.model?.prototype, options?.model, options?.config),
            writable: false, // 只读
        })
    }
    for (const method of methods) {
        if (controller[method]) {
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

    }
}
