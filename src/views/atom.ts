import path from 'path'
import artTemplate from 'art-template'
import { Data } from '@/interfaces/data'

const Atom = (data: Data) => artTemplate(path.join(__dirname, '../../templates/atom.art'), data).replace(/(\n[\s|\t]*\r*\n)/g, '\n') // 去除多余换行符

export default Atom
