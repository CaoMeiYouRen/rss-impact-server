import Parser, { Output, Item } from 'rss-parser'
import queryString from 'query-string'
import dayjs from 'dayjs'
import { deepTrim, uuid } from './helper'
import { Article } from '@/db/models/article.entity'

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

/**
 * RSS 规范化
 *
 * @author CaoMeiYouRen
 * @date 2024-03-21
 * @export
 * @param rss
 */
export function rssNormalize(rss: Record<string, any>) {
    return deepTrim(rss) as (Record<string, any> & Output<Record<string, any>>)
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
    article.guid = item.guid || item.link || uuid()
    article.link = item.link
    article.title = item.title
    article.content = item['content:encoded'] || item.content
    if (item.pubDate || item.isoDate) {
        article.publishDate = dayjs(item.pubDate || item.isoDate).toDate()
    }  // 如果没有 pubDate/isoDate 则留空
    article.author = item.author || item.creator || item['dc:creator']
    article.contentSnippet = item['content:encodedSnippet'] || item.contentSnippet
    article.summary = item.summary
    article.categories = item.categories // 如果是 atom 格式，会丢失 categories 字段
    article.enclosure = item.enclosure
    return article
}
