import { generateAtomFeed } from 'feedsmith'
import { Data } from '@/interfaces/data'

const Atom = (data: Data) => {
    const atom = generateAtomFeed({
        id: data.id || data.link || 'https://github.com/CaoMeiYouRen/rss-impact-server',
        title: data.title || 'RssImpact',
        links: data.link ? [{ href: data.link }] : [],
        subtitle: `${data.description || data.title} - Power by RssImpact(https://github.com/CaoMeiYouRen/rss-impact-server)`,
        logo: data.image,
        updated: data.lastBuildDate ? new Date(data.lastBuildDate) : new Date(),
        authors: data.author ? [{ name: data.author }] : undefined,
        entries: data.item?.map((item) => {
            let authors = undefined
            if (item.author) {
                authors = typeof item.author === 'string' ? [{ name: item.author }] : item.author
            }
            let updated = item.updated ? new Date(item.updated) : undefined
            if (!updated && item.pubDate) {
                updated = new Date(item.pubDate)
            }
            if (!updated) {
                updated = new Date()
            }
            return {
                title: item.title,
                links: item.link ? [{ href: item.link }] : [],
                description: item.description || item.title,
                pubDate: item.pubDate ? new Date(item.pubDate) : undefined,
                updated,
                id: item.guid || item.id || item.link || item.title,
                authors,
                categories: item.category?.map((c) => ({ term: c })),
                enclosures: item.enclosure_url
                    ? [{
                        url: item.enclosure_url,
                        type: item.enclosure_type,
                        length: item.enclosure_length,
                    }]
                    : undefined,
            }
        }),
    })
    return atom.replace(/(\n[\s|\t]*\r*\n)/g, '\n')
}
export default Atom
