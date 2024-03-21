import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import chalk from 'chalk'
import _ from 'lodash'
import { TZ } from '@/app.config'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault(TZ)

/**
 * 延时一段时间
 *
 * @author CaoMeiYouRen
 * @date 2019-08-26
 * @export
 * @param {number} time
 * @returns
 */
export async function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time))
}

/**
 * 随机延时一段时间
 *
 * @author CaoMeiYouRen
 * @date 2022-06-04
 * @export
 * @param [min=1000] 延时最小值
 * @param [max=10000] 延时最大值
 */
export async function randomSleep(min = 1000, max = 10000) {
    const time = _.random(min, max, false)
    await sleep(time)
}

/**
 * 格式化时间
 *
 * @author CaoMeiYouRen
 * @export
 * @param {(number | string | Date)} [date=Date.now()]
 * @param {string} [pattern='YYYY-MM-DD HH:mm:ss.SSS']
 * @returns
 */
export function timeFormat(date: number | string | Date = Date.now(), pattern: string = 'YYYY-MM-DD HH:mm:ss.SSS') {
    if (typeof date === 'number' && date.toString().length === 10) {
        if (date < 1e10) {
            date *= 1000
        }
    }
    return dayjs(date).tz().format(pattern)
}
/**
 *
 * @param {*} str 打印当前时间，可以附加文字
 */
export function printTime(str: any) {
    console.log(`${chalk.yellow(timeFormat(Date.now(), 'YYYY-MM-DD HH:mm:ss.SSS'))} : ${chalk.green(JSON.stringify(str))}`)
}

export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : r & 0x3 | 0x8
        return v.toString(16)
    })
}

export function getAccessToken() {
    return `rss-impact:${uuid()}`
}

export function isImageUrl(img: string) {
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(img)
}

/**
 * 递归删除对象中指定的属性
 * @author CaoMeiYouRen
 * @date 2022-09-27
 * @export
 * @param obj 原始对象
 * @param props 需要删除的属性名称列表
 */
export function deepOmit(obj: any, props: string[]) {
    if (typeof obj !== 'object' || obj === null) { // 类型不为object的或类型为null的都直接返回
        return obj
    }
    props.forEach((key) => { // 排除当前层级的 props
        delete obj[key]
    })
    const keys = Object.keys(obj) // 数组或对象
    for (let i = 0; i < keys.length; i++) { // 遍历所有key
        const key = keys[i]
        obj[key] = deepOmit(obj[key], props)// 递归
    }
    return obj
}

/**
 * 深度处理冗余的空白字符串
 *
 * @author CaoMeiYouRen
 * @date 2024-03-21
 * @export
 * @param obj
 */
export function deepTrim(obj: any) {
    if (typeof obj !== 'object' || obj === null) { // 类型不为object的或类型为null的都直接返回
        return obj
    }
    const keys = Object.keys(obj) // 数组或对象
    for (let i = 0; i < keys.length; i++) { // 遍历所有key
        const key = keys[i]
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim() // 移除空白字符串
        } else {
            obj[key] = deepTrim(obj[key]) // 递归
        }
    }
    return obj
}
