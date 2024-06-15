export const OutputMap = {
    'rss2.0': 'RSS 2.0',
    atom: 'Atom',
    json: 'JSON Feed',
} as const

export const OutputList = Object.entries(OutputMap).map(([value, label]) => ({
    label,
    value,
}))

export type OutputType = keyof typeof OutputMap

export const ScopeMap = {
    all: '全部',
    category: '指定分类',
    feed: '指定订阅',
} as const

export const ScopeList = Object.entries(ScopeMap).map(([value, label]) => ({
    label,
    value,
}))

export type ScopeType = keyof typeof ScopeMap
