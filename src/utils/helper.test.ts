import dayjs from 'dayjs';
import { timeFormat, isImageUrl, deepOmit, deepTrim } from './helper';

describe('timeFormat', () => {
    it('should format the current time with the default pattern', () => {
        const formattedTime = timeFormat();
        const expectedPattern = 'YYYY-MM-DD HH:mm:ss.SSS';
        expect(formattedTime).toMatch(new RegExp(`^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3}$`));
        expect(dayjs(formattedTime, expectedPattern).isValid()).toBe(true);
    });

    it('should format a Date object with a custom pattern', () => {
        const date = new Date(2023, 4, 15, 10, 30, 0);
        date.setUTCHours(10)
        const formattedTime = timeFormat(date, 'MM/DD/YYYY HH:mm');
        expect(formattedTime).toBe('05/15/2023 18:30');
    });

    it('should format a timestamp in seconds with the default pattern', () => {
        const timestamp = 1684147800; // May 15, 2023 10:30:00
        const formattedTime = timeFormat(timestamp, 'YYYY-MM-DD HH:mm:ss');
        expect(formattedTime).toBe('2023-05-15 18:50:00');
    });

    it('should format a timestamp in milliseconds with a custom pattern', () => {
        const timestamp = 1684147800000; // May 15, 2023 10:30:00
        const formattedTime = timeFormat(timestamp, 'YYYY/MM/DD HH:mm:ss');
        expect(formattedTime).toBe('2023/05/15 18:50:00');
    });

    it('should handle invalid input', () => {
        const formattedTime = timeFormat('invalid', 'YYYY-MM-DD');
        expect(formattedTime).toBe('Invalid Date');
    });
});

describe('isImageUrl', () => {
    it('should return true for a valid JPEG image URL', () => {
        const url = 'https://example.com/image.jpg';
        expect(isImageUrl(url)).toBe(true);
    });

    it('should return true for a valid PNG image URL', () => {
        const url = 'http://example.org/image.png';
        expect(isImageUrl(url)).toBe(true);
    });

    it('should return true for a valid GIF image URL', () => {
        const url = 'https://example.net/image.gif';
        expect(isImageUrl(url)).toBe(true);
    });

    it('should return true for a valid WebP image URL', () => {
        const url = 'http://example.com/image.webp';
        expect(isImageUrl(url)).toBe(true);
    });

    it('should return true for a valid BMP image URL', () => {
        const url = 'https://example.org/image.bmp';
        expect(isImageUrl(url)).toBe(true);
    });

    it('should return true for a valid SVG image URL', () => {
        const url = 'http://example.net/image.svg';
        expect(isImageUrl(url)).toBe(true);
    });

    it('should return false for a non-image URL', () => {
        const url = 'https://example.com/document.pdf';
        expect(isImageUrl(url)).toBe(false);
    });

    it('should return false for an empty string', () => {
        const url = '';
        expect(isImageUrl(url)).toBe(false);
    });

    it('should be case-insensitive', () => {
        const url = 'https://example.com/image.JPG';
        expect(isImageUrl(url)).toBe(true);
    });
});

describe('deepOmit', () => {
    it('should return the same object if the input is not an object', () => {
        const input = 42;
        const props = ['foo'];
        const result = deepOmit(input, props);
        expect(result).toBe(input);
    });

    it('should return null if the input is null', () => {
        const input = null;
        const props = ['foo'];
        const result = deepOmit(input, props);
        expect(result).toBeNull();
    });

    it('should remove the specified properties from the object', () => {
        const input = { foo: 1, bar: 2, baz: 3 };
        const props = ['foo', 'baz'];
        const expected = { bar: 2 };
        const result = deepOmit(input, props);
        expect(result).toEqual(expected);
    });

    it('should remove the specified properties from nested objects', () => {
        const input = { foo: 1, bar: { baz: 2, qux: 3 }, quux: { corge: 4, grault: 5 } };
        const props = ['foo', 'grault'];
        const expected = { bar: { baz: 2, qux: 3 }, quux: { corge: 4 } };
        const result = deepOmit(input, props);
        expect(result).toEqual(expected);
    });

    it('should remove the specified properties from nested arrays', () => {
        const input = { foo: 1, bar: [{ baz: 2 }, { qux: 3 }] };
        const props = ['foo', 'baz'];
        const expected = { bar: [{}, { qux: 3 }] };
        const result = deepOmit(input, props);
        expect(result).toEqual(expected);
    });
});

describe('deepTrim', () => {
    it('should return the same value if the input is not an object', () => {
        const input = 42;
        const result = deepTrim(input);
        expect(result).toBe(input);
    });

    it('should return null if the input is null', () => {
        const input = null;
        const result = deepTrim(input);
        expect(result).toBeNull();
    });

    it('should trim leading and trailing whitespace from string values', () => {
        const input = { foo: '  bar  ', baz: 'qux' };
        const expected = { foo: 'bar', baz: 'qux' };
        const result = deepTrim(input);
        expect(result).toEqual(expected);
    });

    it('should trim whitespace from nested string values', () => {
        const input = { foo: '  bar  ', nested: { baz: '  qux  ' } };
        const expected = { foo: 'bar', nested: { baz: 'qux' } };
        const result = deepTrim(input);
        expect(result).toEqual(expected);
    });

    it('should not modify non-string values', () => {
        const input = { foo: 42, bar: true, baz: null };
        const expected = { foo: 42, bar: true, baz: null };
        const result = deepTrim(input);
        expect(result).toEqual(expected);
    });

    it('should handle nested objects and arrays', () => {
        const input = { foo: '  bar  ', nested: { baz: '  qux  ' }, arr: ['  hello  ', '  world  '] };
        const expected = { foo: 'bar', nested: { baz: 'qux' }, arr: ['hello', 'world'] };
        const result = deepTrim(input);
        expect(result).toEqual(expected);
    });
});
