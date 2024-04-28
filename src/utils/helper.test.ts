import dayjs from 'dayjs';
import { timeFormat, isImageUrl, deepOmit, deepTrim, mdToCqcode, dataFormat, splitString } from './helper';

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

describe('mdToCqcode', () => {
    it('should convert Markdown image syntax to CQImage', () => {
        const markdown = '![Alt Text](https://example.com/image.jpg)';
        const expected = '[CQ:image,file=https://example.com/image.jpg]';
        expect(mdToCqcode(markdown)).toBe(expected);
    });

    // it('should convert HTML <img> tag to CQImage', () => {
    //     const markdown = '<img src="https://example.com/image.png" alt="Alt Text">';
    //     const expected = '[CQ:image,file=https://example.com/image.png]';
    //     expect(mdToCqcode(markdown)).toBe(expected);
    // });

    it('should handle multiple images', () => {
        const markdown = '![Alt Text 1](https://example.com/image1.jpg)\n\n![Alt Text 2](https://example.com/image2.png)';
        const expected = '[CQ:image,file=https://example.com/image1.jpg]\n\n[CQ:image,file=https://example.com/image2.png]';
        expect(mdToCqcode(markdown)).toBe(expected);
    });

    it('should preserve non-image text', () => {
        const markdown = 'This is some text.\n\n![Alt Text](https://example.com/image.jpg)\n\nMore text.';
        const expected = 'This is some text.\n\n[CQ:image,file=https://example.com/image.jpg]\n\nMore text.';
        expect(mdToCqcode(markdown)).toBe(expected);
    });
});

describe('dataFormat', () => {
    it('should format bytes correctly for numbers', () => {
        expect(dataFormat(0)).toBe('0 B')
        expect(dataFormat(1023)).toBe('1023 B')
        expect(dataFormat(1024)).toBe('1.00 KiB')
        expect(dataFormat(1048576)).toBe('1.00 MiB')
        expect(dataFormat(1073741824)).toBe('1.00 GiB')
        expect(dataFormat(1099511627776)).toBe('1.00 TiB')
        expect(dataFormat(1125899906842624)).toBe('1.00 PiB')
        expect(dataFormat(1152921504606846976)).toBe('1.00 EiB')
        expect(dataFormat(1180591620717411303424)).toBe('1.00 ZiB')
        expect(dataFormat(1208925819614629174706176)).toBe('1.00 YiB')
    })

    it('should format bytes correctly for bigints', () => {
        expect(dataFormat(0n)).toBe('0 B')
        expect(dataFormat(1023n)).toBe('1023 B')
        expect(dataFormat(1024n)).toBe('1.00 KiB')
        expect(dataFormat(1048576n)).toBe('1.00 MiB')
        expect(dataFormat(1073741824n)).toBe('1.00 GiB')
        expect(dataFormat(1099511627776n)).toBe('1.00 TiB')
        expect(dataFormat(1125899906842624n)).toBe('1.00 PiB')
        expect(dataFormat(1152921504606846976n)).toBe('1.00 EiB')
        expect(dataFormat(1180591620717411303424n)).toBe('1.00 ZiB')
        expect(dataFormat(1208925819614629174706176n)).toBe('1.00 YiB')
    })

    it('should handle decimal values for numbers', () => {
        expect(dataFormat(512)).toBe('512 B')
        expect(dataFormat(2048)).toBe('2.00 KiB')
        expect(dataFormat(3072)).toBe('3.00 KiB')
        expect(dataFormat(1572864)).toBe('1.50 MiB')
    })

    it('should handle large values', () => {
        expect(dataFormat(9223372036854775807)).toBe('8.00 EiB')
        expect(dataFormat(18446744073709551615)).toBe('16.00 EiB')
        expect(dataFormat(18446744073709551616n)).toBe('16.00 EiB')
        expect(dataFormat(36893488147419103232n)).toBe('32.00 EiB')
    })

    it('should throw an error when data is negative', () => {
        expect(() => dataFormat(-1)).toThrow('Data must be greater than or equal to 0');
        expect(() => dataFormat(-100)).toThrow('Data must be greater than or equal to 0');
        expect(() => dataFormat(-1024)).toThrow('Data must be greater than or equal to 0');
        expect(() => dataFormat(-1n)).toThrow('Data must be greater than or equal to 0');
        expect(() => dataFormat(-100n)).toThrow('Data must be greater than or equal to 0');
        expect(() => dataFormat(-1024n)).toThrow('Data must be greater than or equal to 0');
    });
})

describe('splitString', () => {
    it('should split a string into chunks of specified length', () => {
        const str = 'This is a long string that needs to be split into smaller chunks.';
        const maxLength = 10;
        const expected = [
            'This is a ',
            'long strin',
            'g that nee',
            'ds to be s',
            'plit into ',
            'smaller ch',
            'unks.',
        ];

        const result = splitString(str, maxLength);

        expect(result).toEqual(expected);
    });

    it('should handle empty strings', () => {
        const str = '';
        const maxLength = 5;
        const expected = [''];

        const result = splitString(str, maxLength);

        expect(result).toEqual(expected);
    });

    it('should handle strings shorter than maxLength', () => {
        const str = 'short';
        const maxLength = 10;
        const expected = ['short'];

        const result = splitString(str, maxLength);

        expect(result).toEqual(expected);
    });


    it('should return an array with the original string when maxLength is 0', () => {
        const str = 'This is a long string';
        const maxLength = 0;
        const expected = [str];

        const result = splitString(str, maxLength);

        expect(result).toEqual(expected);
    });

    it('should return an array with the original string when maxLength is negative', () => {
        const str = 'This is a long string';
        const maxLength = -5;
        const expected = [str];

        const result = splitString(str, maxLength);

        expect(result).toEqual(expected);
    });
});
