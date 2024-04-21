import path from 'path'
import artTemplate from 'art-template'
import { Data } from '@/interfaces/data'

const RSS = (data: Data) => artTemplate(path.join(__dirname, '../../templates/rss.art'), data).replace(/(\n[\s|\t]*\r*\n)/g, '\n') // 去除多余换行符

export default RSS
