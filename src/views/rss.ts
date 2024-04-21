import path from 'path'
import artTemplate from 'art-template'
import { Data } from '@/interfaces/data'

const RSS = (data: Data) => artTemplate(path.join(__dirname, '../../templates/rss.art'), data)

export default RSS
