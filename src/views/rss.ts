import { generateRssFeed } from 'feedsmith'
import { Data } from '@/interfaces/data'

const RSS = (data: Data) => {
    const rss = generateRssFeed({
        title: data.title || 'RssImpact',
        link: data.link || 'https://github.com/CaoMeiYouRen/rss-impact-server',
        description: `${data.description || data.title} - Power by RssImpact(https://github.com/CaoMeiYouRen/rss-impact-server)`,
        language: data.language || 'zh-cn',
        image: data.image
            ? {
                url: data.image,
                title: data.title || 'RssImpact',
                link: data.link || 'https://github.com/CaoMeiYouRen/rss-impact-server',
            }
            : undefined,
        lastBuildDate: data.lastBuildDate ? new Date(data.lastBuildDate) : undefined,
        ttl: data.ttl,
        itunes: {
            author: data.itunes_author,
            categories: data.itunes_category ? [{ text: data.itunes_category }] : undefined,
            explicit: data.itunes_explicit === 'true' || data.itunes_explicit === true,
        },
        items: data.item?.map((item) => {
            let authors = undefined
            if (item.author) {
                authors = typeof item.author === 'string' ? [{ name: item.author }] : item.author
            }
            return {
                title: item.title,
                link: item.link,
                description: item.description || item.title,
                pubDate: item.pubDate ? new Date(item.pubDate) : undefined,
                guid: { value: item.guid || item.id || item.link || item.title, isPermaLink: false },
                authors,
                categories: item.category?.map((c) => ({ name: c })),
                enclosures: item.enclosure_url
                    ? [{
                        url: item.enclosure_url,
                        type: item.enclosure_type,
                        length: item.enclosure_length,
                    }]
                    : undefined,
                itunes: {
                    duration: typeof item.itunes_duration === 'number' ? item.itunes_duration : undefined,
                    image: item.itunes_item_image,
                },
                media: item.media as any,
            }
        }),
    })
    return rss.replace(/(\n[\s|\t]*\r*\n)/g, '\n')
}
export default RSS
