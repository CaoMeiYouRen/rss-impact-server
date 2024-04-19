import Parser, { Output, Item } from 'rss-parser'
import queryString from 'query-string'
import dayjs from 'dayjs'
import { plainToInstance } from 'class-transformer'
import { isURL } from 'class-validator'
import { deepTrim, htmlToMarkdown, timeFormat, uuid } from './helper'
import { Article, EnclosureImpl } from '@/db/models/article.entity'

export const rssParser = new Parser()

/**
 * 从 url 解析 rss
 *
 * @author CaoMeiYouRen
 * @date 2024-03-21
 * @export
 * @param url
 * @param [query={}]
 */
export async function rssParserURL(url: string, query: Record<string, any> = {}) {
    const _url = queryString.parseUrl(url)
    const rss = await rssParser.parseURL(`${_url.url}?${queryString.stringify(Object.assign({}, _url.query, query))}`)
    return rssNormalize(rss)
}

/**
 * 从 string 解析 rss
 *
 * @author CaoMeiYouRen
 * @date 2024-03-21
 * @export
 * @param xml
 */
export async function rssParserString(xml: string) {
    const rss = await rssParser.parseString(xml)
    return rssNormalize(rss)
}

export function formatGuid(e: any): string {
    // link 基本上是全局唯一的，guid 在部分情况下不唯一（freshrss 的 guid 为时间戳）
    // 如果 guid 是 Url，则用 guid ；否则用 link
    if (isURL(e.guid)) {
        return e.guid
    }
    if (isURL(e.id)) {
        return e.id
    }
    return e.link || uuid()
}

/**
 * RSS 规范化
 *
 * @author CaoMeiYouRen
 * @date 2024-03-21
 * @export
 * @param rss
 */
export function rssNormalize(rss: Record<string, any>) {
    const _rss = deepTrim(rss) as (Record<string, any> & Output<Record<string, any>>)
    if (_rss?.items?.length) {
        _rss.items = _rss.items.map((e) => ({
            ...e,
            guid: formatGuid(e),
        }))
    }
    return _rss
}

/**
 * 转换 RSS Item 到 Article
 *
 * @author CaoMeiYouRen
 * @date 2024-03-21
 * @export
 * @param item
 */
export function rssItemToArticle(item: Record<string, any> & Item) {
    const article = new Article()
    article.guid = formatGuid(item)
    article.link = item.link
    article.title = item.title
    article.content = item['content:encoded'] || item.content
    if (item.pubDate || item.isoDate) {
        article.pubDate = dayjs(item.pubDate || item.isoDate).toDate()
    }  // 如果没有 pubDate/isoDate 则留空
    article.author = item.author || item.creator || item['dc:creator']
    article.contentSnippet = item['content:encodedSnippet'] || item.contentSnippet
    article.summary = item.summary || article.contentSnippet?.slice(0, 128) // 如果没有总结，则使用 contentSnippet 填充
    article.categories = item.categories
    article.enclosure = item.enclosure || item.mediaContent // 解决部分情况下缺失 enclosure 的问题
    if (!article.enclosure && /^(https?:\/\/).*(\.torrent$)/.test(article.link)) {  // 检测 link 后缀是否为 .torrent。例如 nyaa.si
        article.enclosure = {
            url: article.link,
            type: 'application/x-bittorrent',
        }
    }
    if (article.enclosure) {
        if (/^(https?:\/\/)/.test(article.enclosure.url)) { // 如果以 http 开头，则尝试规范化 URL。例如 bangumi.moe
            article.enclosure.url = new URL(article.enclosure.url).toString()
        }
        if (typeof article.enclosure.length === 'string') { // 如果解析出来的 length 是 string ，则需要转换成 number
            article.enclosure.length = Number(article.enclosure.length)
        }
        article.enclosure = plainToInstance(EnclosureImpl, article.enclosure)
    }
    return article
}

export type ArticleFormatoption = {
    // 是否为 Markdown 格式
    isMarkdown?: boolean
    // 是否为 纯文本（去除 HTML）
    isSnippet?: boolean
}

export function articleItemFormat(item: Article, option: ArticleFormatoption = {}) {
    const { isMarkdown = false, isSnippet = false } = option
    const title: string = item.title?.replace(/\.\.\.$/, '') // 移除句末省略号
    let text = ''
    const content = isSnippet ? item.contentSnippet : item.content

    // 排除内容和标题重复
    if (title && !content?.startsWith(title)) {
        text += `${title}\n`
    }

    if (isMarkdown) {
        text += htmlToMarkdown(content)
        text += '\n'
    } else {
        text += `${content}\n`
    }
    if (item.author) {
        text += `作者：${item.author}\n`
    }
    if (item.enclosure?.url) {
        text += `资源链接：${item.enclosure?.url}\n`
    }
    if (item.link) {
        text += `链接：${item.link}\n`
    }
    if (item.pubDate) {
        const date = timeFormat(item.pubDate, 'YYYY-MM-DD HH:mm:ss')
        text += `时间：${date}`
    }

    text = text.replace(/(\n[\s|\t]*\r*\n)/g, '\n') // 去除多余换行符
    if (isMarkdown) {
        text = text.replace(/\n/g, '\n\n') // 替换为markdown下的换行
    }
    return {
        title,
        text,
        date: item.pubDate || '',
    }
}

/**
 * 格式化 Article
 *
 * @author CaoMeiYouRen
 * @date 2024-03-26
 * @export
 * @param articles
 * @param [markdown=false]
 */
export function articlesFormat(articles: Article[], option: ArticleFormatoption = {}) {
    const text = articles
        .map((item) => articleItemFormat(item, option))
        .map((e) => e.text)
        .join(option?.isMarkdown ? '\n\n' : '\n')
    return text
}
