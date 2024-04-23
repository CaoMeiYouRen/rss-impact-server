import { isUUID } from "class-validator";
import { formatGuid, rssItemToArticle } from "./rss-helper";
import { Article, EnclosureImpl } from "@/db/models/article.entity";
import { plainToInstance } from "class-transformer";

describe('formatGuid', () => {

    it('should return guid if it is a URL', () => {
        const entry = { guid: 'https://example.com/article', link: 'https://example.com/article' };
        const result = formatGuid(entry);
        expect(result).toBe(entry.guid);
    });

    it('should return id if it is a URL and guid is not a URL', () => {
        const entry = { guid: '1234567890', id: 'https://example.com/article', link: 'https://example.com/article' };
        const result = formatGuid(entry);
        expect(result).toBe(entry.id);
    });

    it('should return link if guid and id are not URLs', () => {
        const entry = { guid: '1234567890', id: '0987654321', link: 'https://example.com/article' };
        const result = formatGuid(entry);
        expect(result).toBe(entry.link);
    });

    it('should return a UUID if guid, id, and link are not URLs', () => {
        const entry = { guid: '1234567890', id: '0987654321', link: '' };
        const result = formatGuid(entry);
        expect(isUUID(result)).toBe(true)
    });
});


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
                length: '1024' as any
            }
        };

        const expectedArticle = new Article();
        expectedArticle.guid = 'https://example.com/article';
        expectedArticle.link = 'https://example.com/article';
        expectedArticle.title = 'Article Title';
        expectedArticle.content = 'Article content';
        expectedArticle.pubDate = new Date('2023-03-21T10:00:00Z');
        expectedArticle.author = 'John Doe';
        expectedArticle.contentSnippet = 'Article snippet';
        expectedArticle.summary = 'Article summary';
        expectedArticle.categories = ['Category 1', 'Category 2'];
        expectedArticle.enclosure = plainToInstance(EnclosureImpl, {
            url: 'https://example.com/file.torrent',
            type: 'application/x-bittorrent',
            length: 1024
        });

        const article = rssItemToArticle(rssItem);
        expect(article).toEqual(expectedArticle);
    });

    it('should handle missing fields correctly', () => {
        const rssItem = {
            guid: 'https://example.com/article',
            link: 'https://example.com/article',
            title: 'Article Title',
            'content:encoded': 'Article content',
            'content:encodedSnippet': 'Article content'
        };

        const expectedArticle = new Article();
        expectedArticle.guid = 'https://example.com/article';
        expectedArticle.link = 'https://example.com/article';
        expectedArticle.title = 'Article Title';
        expectedArticle.content = 'Article content';
        expectedArticle.contentSnippet = 'Article content';
        expectedArticle.enclosure = plainToInstance(EnclosureImpl, {})

        const article = rssItemToArticle(rssItem);
        expect(article).toEqual(expectedArticle);
    });

    it('should handle enclosure with URL normalization', () => {
        const rssItem = {
            guid: 'https://example.com/article',
            link: 'https://example.com/article',
            title: 'Article Title',
            'content:encoded': 'Article content',
            enclosure: {
                url: 'http://example.com/file.torrent',
                type: 'application/x-bittorrent',
                length: '1024' as any
            }
        };

        const expectedArticle = new Article();
        expectedArticle.guid = 'https://example.com/article';
        expectedArticle.link = 'https://example.com/article';
        expectedArticle.title = 'Article Title';
        expectedArticle.content = 'Article content';
        expectedArticle.enclosure = plainToInstance(EnclosureImpl, {
            url: 'http://example.com/file.torrent',
            type: 'application/x-bittorrent',
            length: 1024
        });

        const article = rssItemToArticle(rssItem);
        expect(article.enclosure?.url).toBe('http://example.com/file.torrent');
    });

    it('should handle enclosure with length as string', () => {
        const rssItem = {
            guid: 'https://example.com/article',
            link: 'https://example.com/article',
            title: 'Article Title',
            'content:encoded': 'Article content',
            enclosure: {
                url: 'https://example.com/file.torrent',
                type: 'application/x-bittorrent',
                length: '1024' as any
            }
        };

        const expectedArticle = new Article();
        expectedArticle.guid = 'https://example.com/article';
        expectedArticle.link = 'https://example.com/article';
        expectedArticle.title = 'Article Title';
        expectedArticle.content = 'Article content';
        expectedArticle.enclosure = plainToInstance(EnclosureImpl, {
            url: 'https://example.com/file.torrent',
            type: 'application/x-bittorrent',
            length: 1024
        });

        const article = rssItemToArticle(rssItem);
        expect(article.enclosure?.length).toBe(1024);
    });

    it('should handle link as enclosure for torrent files', () => {
        const rssItem = {
            guid: 'https://example.com/article',
            link: 'https://example.com/file.torrent',
            title: 'Article Title',
            'content:encoded': 'Article content'
        };

        const expectedArticle = new Article();
        expectedArticle.guid = 'https://example.com/article';
        expectedArticle.link = 'https://example.com/file.torrent';
        expectedArticle.title = 'Article Title';
        expectedArticle.content = 'Article content';
        expectedArticle.enclosure = plainToInstance(EnclosureImpl, {
            url: 'https://example.com/file.torrent',
            type: 'application/x-bittorrent'
        });

        const article = rssItemToArticle(rssItem);
        expect(article.enclosure).toEqual(expectedArticle.enclosure);
    });
});
