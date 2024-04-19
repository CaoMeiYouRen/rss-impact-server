import { isUUID } from "class-validator";
import { formatGuid } from "./rss-helper";

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
