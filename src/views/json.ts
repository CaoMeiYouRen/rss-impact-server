import { generateJsonFeed } from 'feedsmith'
import { Data } from '@/interfaces/data'

/**
 * This function should be used by RSSHub middleware only.
 * @param {object} data ctx.state.data
 * @returns `JSON.stringify`-ed [JSON Feed](https://www.jsonfeed.org/)
 */
const json = (data: Data) => {
    const jsonFeed = generateJsonFeed({
        title: data.title || 'RssImpact',
        home_page_url: data.link || 'https://github.com/CaoMeiYouRen/rss-impact-server',
        description: `${data.description || data.title} - Power by RssImpact(https://github.com/CaoMeiYouRen/rss-impact-server)`,
        icon: data.image,
        authors: data.author ? [{ name: data.author }] : undefined,
        language: data.language || 'zh-cn',
        items: data.item?.map((item) => {
            let authors = undefined
            if (item.author) {
                authors = typeof item.author === 'string' ? [{ name: item.author }] : item.author
            }
            return {
                id: item.guid || item.id || item.link || item.title,
                url: item.link,
                title: item.title,
                summary: item.description || item.title,
                content_html: item.content?.html,
                content_text: item.content?.text,
                image: item.image,
                banner_image: item.banner,
                date_published: item.pubDate ? new Date(item.pubDate) : undefined,
                date_modified: item.updated ? new Date(item.updated) : undefined,
                authors,
                tags: item.category,
                language: item.language,
                attachments: item.enclosure_url
                    ? [{
                        url: item.enclosure_url,
                        mime_type: item.enclosure_type,
                        title: item.enclosure_title,
                        size_in_bytes: item.enclosure_length,
                        duration_in_seconds: typeof item.itunes_duration === 'number' ? item.itunes_duration : undefined,
                    }]
                    : undefined,
            }
        }),
    })
    return jsonFeed as any
}

export default json
