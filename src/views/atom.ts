import path from 'path'
import artTemplate from 'art-template'
import { Data } from '@/interfaces/data'

const Atom = (data: Data) => artTemplate(path.join(__dirname, '../../templates/atom.art'), data)

export default Atom
