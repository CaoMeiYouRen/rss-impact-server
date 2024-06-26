export type DataItem = {
    title: string
    description?: string
    pubDate?: number | string | Date
    link?: string
    category?: string[]
    author?: string | { name: string }[]
    doi?: string
    guid?: string
    id?: string
    summary?: string
    content?: {
        html: string
        text: string
    }
    image?: string
    banner?: string
    updated?: number | string | Date
    language?: string
    enclosure_url?: string
    enclosure_type?: string
    enclosure_title?: string
    enclosure_length?: number
    itunes_duration?: number | string
    itunes_item_image?: string
    media?: Record<string, Record<string, string>>

    _extra?: Record<string, any> & {
        links?: {
            url: string
            type: string
            content_html?: string
        }[]
    }
}

export type Data = {
    title: string
    description?: string
    subtitle?: string
    link?: string
    item?: DataItem[]
    allowEmpty?: boolean
    image?: string
    author?: string
    language?: string
    feedLink?: string
    lastBuildDate?: string
    itunes_author?: string
    itunes_category?: string
    itunes_explicit?: string | boolean
    id?: string

    atomlink?: string
    ttl?: number
}
