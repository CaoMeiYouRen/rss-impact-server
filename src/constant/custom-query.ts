export const OutputTypeMap = {
    'rss2.0': 'RSS 2.0',
    atom: 'Atom',
    json: 'JSON Feed',
} as const

export const OutputTypeList = Object.entries(OutputTypeMap).map(([value, label]) => ({
    label,
    value,
}))

export type OutputType = keyof typeof OutputTypeMap
