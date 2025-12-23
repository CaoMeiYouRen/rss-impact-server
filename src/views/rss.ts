import path from 'path'
import artTemplate from 'art-template'
import { Data } from '@/interfaces/data'

const RSS = (data: Data) => {
    const result = artTemplate(path.join(__dirname, '../../templates/rss.art'), data)
    if (!result) {
        throw new Error('RSS template rendering failed')
    }
    return result.replace(/(\n[\s|\t]*\r*\n)/g, '\n')
}
export default RSS
