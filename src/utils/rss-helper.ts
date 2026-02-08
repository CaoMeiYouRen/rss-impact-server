import { promisify } from 'util'
import Parser, { Output, Item, Enclosure } from '@cao-mei-you-ren/rss-parser'
import queryString from 'query-string'
import dayjs from 'dayjs'
import { isURL } from 'class-validator'
import XRegExp from 'xregexp'
import opml, { Opml } from 'opml'
import { collapseWhitespace, deepTrim, htmlToMarkdown, isHttpURL, parseDataSize, timeFormat, uuid } from './helper'
import { Article } from '@/db/models/article.entity'
import { DataItem } from '@/interfaces/data'
import { Filter } from '@/models/filter.dto'
import { FilterOut } from '@/models/filter-out.dto'

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
    if (isURL(e.link)) {
        return e.link
    }
    // jackett 中的 comments 为 url link。
    if (isURL(e.comments)) {
        return e.comments
    }
    return uuid()
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
    if (isURL(item.link)) {
        article.link = item.link
    } else if (isURL(article.guid)) {
        article.link = article.guid
    } else {
        article.link = null
    }

    article.title = item.title
    article.content = item['content:encoded'] || item.content
    if (item.pubDate || item.isoDate) {
        const pubDate = dayjs(item.pubDate || item.isoDate)
        article.pubDate = pubDate.toDate()
        // 验证 pubDate 的时间是否为有效时间
        // 1. 如果 pubDate 为未来时间，且超过当前服务器时间 5 分钟以上，则认定该时间无效
        // 2. 如果 pubDate 为过去时间，且小于 new Date(0)（1970-01-01），则认定该时间无效
        const now = dayjs()
        if (pubDate.isAfter(now.add(5, 'minute'))) { // 未来时间
            article.pubDate = now.toDate()
        } else if (pubDate.isBefore(dayjs(0))) { // 过去时间
            article.pubDate = null
        }
    } // 如果没有 pubDate/isoDate 则留空
    article.author = item.author || item.creator || item['dc:creator']
    article.contentSnippet = item['content:encodedSnippet'] || item.contentSnippet
    article.summary = item.summary
    article.categories = item.categories

    let enclosure: Enclosure = item.enclosure || item.mediaContent // 解决部分情况下缺失 enclosure 的问题
    if (!enclosure && /^(https?:\/\/).*(\.torrent$)/.test(article.link)) { // 检测 link 后缀是否为 .torrent。例如 nyaa.si
        enclosure = {
            url: article.link,
            type: 'application/x-bittorrent',
        }
    }
    if (enclosure) {
        article.enclosureType = enclosure.type
        if (isHttpURL(enclosure.url)) { // 如果以 http 开头，则尝试规范化 URL。例如 bangumi.moe
            article.enclosureUrl = new URL(enclosure.url).toString()
        } else {
            article.enclosureUrl = enclosure.url
        }
        if (typeof enclosure.length === 'string') { // 如果解析出来的 length 是 string ，则需要转换成 number
            article.enclosureLength = Number(enclosure.length)
        } else {
            article.enclosureLength = enclosure.length
        }
    }
    return article
}

export interface ArticleFormatoption {
    // 是否为 Markdown 格式
    isMarkdown?: boolean
    // 是否为 纯文本（去除 HTML）
    isSnippet?: boolean
    // 只推送总结部分
    onlySummary?: boolean
    // 使用 AI 总结
    useAiSummary?: boolean
    // 增加 AI 总结
    appendAiSummary?: boolean
}

export function articleItemFormat(item: Article, option: ArticleFormatoption = {}) {
    const { isMarkdown = false, isSnippet = false, onlySummary = false, useAiSummary = false, appendAiSummary = false } = option
    const title: string = collapseWhitespace(item.title?.replace(/\.\.\.$/, '').replaceAll('<br>', '\n')) // 移除句末省略号
    let text = ''
    let content = ''
    if (onlySummary) {
        if (useAiSummary && item.aiSummary) {
            content = item.aiSummary
        } else {
            content = item.summary || item.contentSnippet?.slice(0, 512)
        }
    } else if (isSnippet) {
        if (appendAiSummary && item.aiSummary) {
            content += `AI 输出：\n${item.aiSummary}\n`
        }
        content += item.contentSnippet
    } else {
        if (appendAiSummary && item.aiSummary) {
            content += `<p><b>AI 输出：\n${item.aiSummary}</b></p>\n`
        }
        content += item.content
    }

    // 排除内容和标题重复
    if (title && !collapseWhitespace(content.replaceAll('<br>', '\n'))?.includes(title)) {
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
    if (item.enclosureUrl) {
        if (isMarkdown) {
            text += `资源链接：[${item.enclosureUrl}](${item.enclosureUrl})\n`
        } else {
            text += `资源链接：${item.enclosureUrl}\n`
        }
    }
    if (item.link) {
        if (isMarkdown) {
            text += `链接：[${item.link}](${item.link})\n`
        } else {
            text += `链接：${item.link}\n`
        }
    }
    if (item.pubDate) {
        const date = timeFormat(item.pubDate, 'YYYY-MM-DD HH:mm:ss')
        text += `时间：${date}`
    }

    text = text.replace(/(\n[\s|\t]*\r*\n)/g, '\n').replace(/\n+/g, '\n')// 去除多余换行符
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
 * 获取正文
 *
 * @author CaoMeiYouRen
 * @date 2024-04-23
 * @export
 * @param item
 * @param [isSnippet=true] 是否为 纯文本（去除 HTML）
 * @param [hasTitle=true] 是否包括标题
 */
export function getArticleContent(item: Article, isSnippet: boolean = true, hasTitle: boolean = true) {
    const title: string = item.title?.replace(/\.\.\.$/, '') // 移除句末省略号
    let text = ''
    const content = isSnippet ? item.contentSnippet : item.content
    // 排除内容和标题重复
    if (hasTitle && title && !content?.startsWith(title)) {
        text = `${title}\n`
    }
    text += `${content}`
    text = text.replace(/(\n[\s|\t]*\r*\n)/g, '\n') // 去除多余换行符
    text = text.trim() // 去除多余空白符
    return text
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
        .join(option?.isMarkdown ? `\n\n${htmlToMarkdown('<hr/>')}\n\n` : '\n')
    return text
}

interface Condition {
    filter: Filter
    filterout: FilterOut
}

const filterFields = ['link', 'title', 'content', 'summary', 'author', 'categories', 'enclosureUrl', 'enclosureType', 'enclosureLength']

/**
 * 按条件过滤文章
 *
 * @author CaoMeiYouRen
 * @date 2024-04-21
 * @export
 * @param articles 文章数组
 * @param condition 条件
 */
export function filterArticles(articles: Article[], condition: Condition): Article[] {
    const { filterout, filter } = condition
    return articles
        .filter((article) => {
            if (!article.pubDate || !condition.filter.time) { // 没有 pubDate/filter.time 不受过滤时间限制
                return true
            }
            return dayjs().diff(article.pubDate, 'second') <= condition.filter.time
        })
        // 先判断 filterout
        .filter((article) => filterFields.every((field) => { // 所有条件为 并集，即 有一个 不符合 就排除
            if (!filterout[field] || !article[field]) { // 如果缺少 filterout 或 article 对应的项就跳过该过滤条件
                return true
            }
            if (field === 'categories') {
                // 有一个 category 对的上就 排除
                return !article[field].some((category) => XRegExp(filterout[field], 'ig').test(category))
            }
            return !XRegExp(filterout[field], 'ig').test(article[field])
        }))
        // 再判断 filter
        .filter((article) => filterFields.every((field) => { // 所有条件为 交集，即 需要全部条件 符合
            if (!filter[field] || !article[field]) { // 如果缺少 filter 或 article 对应的项就跳过该过滤条件
                return true
            }
            if (field === 'enclosureLength') {
                // 保留体积，只下载体积小于 enclosureLength 的资源
                return parseDataSize(filter.enclosureLength) > article.enclosureLength
            }
            if (field === 'categories') {
                // 有一个 category 对的上就为 true
                return article[field].some((category) => XRegExp(filter[field], 'ig').test(category))
            }
            return XRegExp(filter[field], 'ig').test(article[field])
        }))
        .slice(0, filter.limit || 20) // 默认最多 20 条
}

interface ArticleOption {
    useAiSummary?: boolean
    appendAiSummary?: boolean
}

export function articleToDataItem(article: Article, option: ArticleOption = {}): DataItem {
    const { useAiSummary = false, appendAiSummary = false } = option
    let content = article.content
    let contentSnippet = article.contentSnippet
    if (appendAiSummary && article.aiSummary) {
        content = `<p><b>AI 输出：
${article.aiSummary}</b></p>
<hr/>

${article.content}`

        contentSnippet = `AI 输出：
${article.aiSummary}

${article.contentSnippet}`
    }

    content = content.replace(/\n/g, '<br>') // 替换换行符为 <br>
    const dataItem: DataItem = {
        ...article,
        title: article.title || '',
        id: article.guid,
        content: {
            html: content,
            text: contentSnippet,
        },
        description: content,
        summary: useAiSummary && article.aiSummary || article.summary || article.contentSnippet?.slice(0, 256), // 如果没有总结，则使用 contentSnippet 填充
        category: article.categories,
        pubDate: article.pubDate.toUTCString(),
        updated: article.pubDate.toUTCString(),
        enclosure_url: article.enclosureUrl,
        enclosure_type: article.enclosureType,
        enclosure_length: article.enclosureLength,
    }
    return dataItem
}

const asyncParse = promisify(opml.parse)
/**
 * 解析 OPML
 *
 * @author CaoMeiYouRen
 * @date 2024-05-02
 * @export
 * @param input
 */
export async function opmlParse(input: string) {
    return (await asyncParse(input)).opml
}

/**
 * 生成 OPML
 *
 * @author CaoMeiYouRen
 * @date 2024-05-02
 * @export
 * @param output
 */
export function opmlStringify(output: Opml) {
    return opml.stringify({ opml: output }).replace('encoding="ISO-8859-1"', 'encoding="UTF-8"')
}
