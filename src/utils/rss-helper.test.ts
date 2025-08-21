import { isUUID } from 'class-validator'
import dayjs from 'dayjs'
import { formatGuid, rssItemToArticle, filterArticles } from './rss-helper'
import { Article } from '@/db/models/article.entity'

describe('formatGuid', () => {
    it('should return guid if it is a URL', () => {
        const entry = { guid: 'https://example.com/article', link: 'https://example.com/article' }
        const result = formatGuid(entry)
        expect(result).toBe(entry.guid)
    })

    it('should return id if it is a URL and guid is not a URL', () => {
        const entry = { guid: '1234567890', id: 'https://example.com/article', link: 'https://example.com/article' }
        const result = formatGuid(entry)
        expect(result).toBe(entry.id)
    })

    it('should return link if guid and id are not URLs', () => {
        const entry = { guid: '1234567890', id: '0987654321', link: 'https://example.com/article' }
        const result = formatGuid(entry)
        expect(result).toBe(entry.link)
    })

    it('should return a UUID if guid, id, and link are not URLs', () => {
        const entry = { guid: '1234567890', id: '0987654321', link: '' }
        const result = formatGuid(entry)
        expect(isUUID(result)).toBe(true)
    })
})

describe('rssItemToArticle', () => {
    it('should convert RSS item to Article correctly', () => {
        const rssItem = {
            guid: 'https://example.com/article',
            link: 'https://example.com/article',
            title: 'Article Title',
            'content:encoded': 'Article content',
            pubDate: '2023-03-21T10:00:00Z',
            author: 'John Doe',
            'content:encodedSnippet': 'Article snippet',
            summary: 'Article summary',
            categories: ['Category 1', 'Category 2'],
            enclosure: {
                url: 'https://example.com/file.torrent',
                type: 'application/x-bittorrent',
                length: '1024' as any,
            },
        }

        const expectedArticle = new Article()
        expectedArticle.guid = 'https://example.com/article'
        expectedArticle.link = 'https://example.com/article'
        expectedArticle.title = 'Article Title'
        expectedArticle.content = 'Article content'
        expectedArticle.pubDate = new Date('2023-03-21T10:00:00Z')
        expectedArticle.author = 'John Doe'
        expectedArticle.contentSnippet = 'Article snippet'
        expectedArticle.summary = 'Article summary'
        expectedArticle.categories = ['Category 1', 'Category 2']
        // expectedArticle.enclosure = plainToInstance(EnclosureImpl, {
        //     url: 'https://example.com/file.torrent',
        //     type: 'application/x-bittorrent',
        //     length: 1024
        // });
        expectedArticle.enclosureType = 'application/x-bittorrent'
        expectedArticle.enclosureUrl = 'https://example.com/file.torrent'
        expectedArticle.enclosureLength = 1024

        const article = rssItemToArticle(rssItem)
        expect(article).toEqual(expectedArticle)
    })

    it('should handle missing fields correctly', () => {
        const rssItem = {
            guid: 'https://example.com/article',
            link: 'https://example.com/article',
            title: 'Article Title',
            'content:encoded': 'Article content',
            'content:encodedSnippet': 'Article content',
        }

        const expectedArticle = new Article()
        expectedArticle.guid = 'https://example.com/article'
        expectedArticle.link = 'https://example.com/article'
        expectedArticle.title = 'Article Title'
        expectedArticle.content = 'Article content'
        expectedArticle.contentSnippet = 'Article content'

        const article = rssItemToArticle(rssItem)
        expect(article).toEqual(expectedArticle)
    })

    it('should handle enclosure with URL normalization', () => {
        const rssItem = {
            guid: 'https://example.com/article',
            link: 'https://example.com/article',
            title: 'Article Title',
            'content:encoded': 'Article content',
            enclosure: {
                url: 'http://example.com/file.torrent',
                type: 'application/x-bittorrent',
                length: '1024' as any,
            },
        }

        const expectedArticle = new Article()
        expectedArticle.guid = 'https://example.com/article'
        expectedArticle.link = 'https://example.com/article'
        expectedArticle.title = 'Article Title'
        expectedArticle.content = 'Article content'
        expectedArticle.enclosureType = 'application/x-bittorrent'
        expectedArticle.enclosureUrl = 'https://example.com/file.torrent'
        expectedArticle.enclosureLength = 1024
        const article = rssItemToArticle(rssItem)
        expect(article.enclosureUrl).toBe('http://example.com/file.torrent')
    })

    it('should handle enclosure with length as string', () => {
        const rssItem = {
            guid: 'https://example.com/article',
            link: 'https://example.com/article',
            title: 'Article Title',
            'content:encoded': 'Article content',
            enclosure: {
                url: 'https://example.com/file.torrent',
                type: 'application/x-bittorrent',
                length: '1024' as any,
            },
        }

        const expectedArticle = new Article()
        expectedArticle.guid = 'https://example.com/article'
        expectedArticle.link = 'https://example.com/article'
        expectedArticle.title = 'Article Title'
        expectedArticle.content = 'Article content'
        expectedArticle.enclosureType = 'application/x-bittorrent'
        expectedArticle.enclosureUrl = 'https://example.com/file.torrent'
        expectedArticle.enclosureLength = 1024
        const article = rssItemToArticle(rssItem)
        expect(article.enclosureLength).toBe(1024)
    })

    it('should handle link as enclosure for torrent files', () => {
        const rssItem = {
            guid: 'https://example.com/article',
            link: 'https://example.com/file.torrent',
            title: 'Article Title',
            'content:encoded': 'Article content',
        }

        const expectedArticle = new Article()
        expectedArticle.guid = 'https://example.com/article'
        expectedArticle.link = 'https://example.com/file.torrent'
        expectedArticle.title = 'Article Title'
        expectedArticle.content = 'Article content'
        expectedArticle.enclosureType = 'application/x-bittorrent'
        expectedArticle.enclosureUrl = 'https://example.com/file.torrent'
        const article = rssItemToArticle(rssItem)
        expect(article.enclosureType).toEqual(expectedArticle.enclosureType)
        expect(article.enclosureUrl).toEqual(expectedArticle.enclosureUrl)
    })
})

describe('filterArticles', () => {
    const articles = [
        {
            guid: '1',
            link: 'https://example.com/article1',
            title: 'Article 1',
            content: 'This is the content of Article 1.',
            pubDate: dayjs('2023-04-01').toDate(),
            author: 'John Doe',
            contentSnippet: 'This is the content snippet of Article 1.',
            summary: 'This is the summary of Article 1.',
            aiSummary: 'This is the AI summary of Article 1.',
            categories: ['category1', 'category2'],
        },
        {
            guid: '2',
            link: 'https://example.com/article2',
            title: 'Article 2',
            content: 'This is the content of Article 2.',
            pubDate: dayjs('2023-04-02').toDate(),
            author: 'Jane Smith',
            contentSnippet: 'This is the content snippet of Article 2.',
            summary: 'This is the summary of Article 2.',
            aiSummary: 'This is the AI summary of Article 2.',
            categories: ['category2', 'category3'],
            enclosure: {
                url: 'https://example.com/article2.pdf',
                type: 'application/pdf',
                length: 2048,
            },
        },
        {
            guid: '3',
            link: 'https://example.com/article3',
            title: 'Article 3',
            content: 'This is the content of Article 3.',
            pubDate: dayjs('2023-04-03').toDate(),
            author: 'Bob Johnson',
            contentSnippet: 'This is the content snippet of Article 3.',
            summary: 'This is the summary of Article 3.',
            aiSummary: 'This is the AI summary of Article 3.',
            categories: ['category3', 'category4'],
            enclosure: {
                url: 'https://example.com/article3.zip',
                type: 'application/zip',
                length: 4096,
            },
        },
    ] as Article[]

    it('should filter articles based on the given condition', () => {
        const condition = {
            filter: {
                // time: 86400, // 24 hours
                title: 'Article 1|Article 3',
                categories: 'category2|category4',
                enclosureUrl: 'article1\\.mp3|article3\\.zip',
                enclosureType: 'audio/mpeg|application/zip',
                enclosureLength: 2048,
            },
            filterout: {
                title: 'Article 2',
                author: 'Jane Smith',
                categories: 'category3',
                enclosureUrl: 'article2\\.pdf',
                enclosureType: 'application/pdf',
            },
        }

        const filteredArticles = filterArticles(articles, condition)

        expect(filteredArticles).toHaveLength(1)
        expect(filteredArticles[0].guid).toBe('1')
    })

    it('should return all articles if the condition is empty', () => {
        const condition = {
            filter: {},
            filterout: {},
        }

        const filteredArticles = filterArticles(articles, condition)

        expect(filteredArticles).toHaveLength(3)
    })

    it('should handle articles without pubDate or filter.time', () => {
        const articlesWithoutPubDate = [
            {
                guid: '4',
                link: 'https://example.com/article4',
                title: 'Article 4',
                content: 'This is the content of Article 4.',
                author: 'Alice Wilson',
                contentSnippet: 'This is the content snippet of Article 4.',
                summary: 'This is the summary of Article 4.',
                aiSummary: 'This is the AI summary of Article 4.',
                categories: ['category4', 'category5'],

            },
        ] as Article[]

        const condition = {
            filter: {
                time: 86400,
            },
            filterout: {},
        }

        const filteredArticles = filterArticles(articlesWithoutPubDate, condition)

        expect(filteredArticles).toHaveLength(1)
        expect(filteredArticles[0].guid).toBe('4')
    })
})
