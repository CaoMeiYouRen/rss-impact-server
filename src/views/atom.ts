import path from 'path'
import artTemplate from 'art-template'
import { Data } from '@/interfaces/data'

const Atom = (data: Data) => {
    const result = artTemplate(path.join(__dirname, '../../templates/atom.art'), data)
    if (!result) {
        throw new Error('Atom template rendering failed')
    }
    return result.replace(/(\n[\s|\t]*\r*\n)/g, '\n')
}
export default Atom
