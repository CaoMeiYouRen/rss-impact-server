/* eslint-disable no-loss-of-precision */
import dayjs from 'dayjs'
import { Between, Equal, ILike, In, Like } from 'typeorm'
import { timeFormat, isImageUrl, deepOmit, deepTrim, mdToCqcode, dataFormat, splitString, timeFromNow, collapseWhitespace, parseDataSize, htmlToMarkdown, escapeMarkdown, unescapeMarkdown, splitStringWithLineBreak, transformQueryOperator } from './helper'

describe('timeFormat', () => {
    it('should format the current time with the default pattern', () => {
        const formattedTime = timeFormat()
        const expectedPattern = 'YYYY-MM-DD HH:mm:ss.SSS'
        expect(formattedTime).toMatch(new RegExp('^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3}$'))
        expect(dayjs(formattedTime, expectedPattern).isValid()).toBe(true)
    })

    it('should format a Date object with a custom pattern', () => {
        const date = new Date(2023, 4, 15, 10, 30, 0)
        date.setUTCHours(10)
        const formattedTime = timeFormat(date, 'MM/DD/YYYY HH:mm')
        expect(formattedTime).toBe('05/15/2023 18:30')
    })

    it('should format a timestamp in seconds with the default pattern', () => {
        const timestamp = 1684147800 // May 15, 2023 10:30:00
        const formattedTime = timeFormat(timestamp, 'YYYY-MM-DD HH:mm:ss')
        expect(formattedTime).toBe('2023-05-15 18:50:00')
    })

    it('should format a timestamp in milliseconds with a custom pattern', () => {
        const timestamp = 1684147800000 // May 15, 2023 10:30:00
        const formattedTime = timeFormat(timestamp, 'YYYY/MM/DD HH:mm:ss')
        expect(formattedTime).toBe('2023/05/15 18:50:00')
    })

    it('should handle invalid input', () => {
        const formattedTime = timeFormat('invalid', 'YYYY-MM-DD')
        expect(formattedTime).toBe('Invalid Date')
    })
})

describe('isImageUrl', () => {
    it('should return true for a valid JPEG image URL', () => {
        const url = 'https://example.com/image.jpg'
        expect(isImageUrl(url)).toBe(true)
    })

    it('should return true for a valid PNG image URL', () => {
        const url = 'http://example.org/image.png'
        expect(isImageUrl(url)).toBe(true)
    })

    it('should return true for a valid GIF image URL', () => {
        const url = 'https://example.net/image.gif'
        expect(isImageUrl(url)).toBe(true)
    })

    it('should return true for a valid WebP image URL', () => {
        const url = 'http://example.com/image.webp'
        expect(isImageUrl(url)).toBe(true)
    })

    it('should return true for a valid BMP image URL', () => {
        const url = 'https://example.org/image.bmp'
        expect(isImageUrl(url)).toBe(true)
    })

    it('should return true for a valid SVG image URL', () => {
        const url = 'http://example.net/image.svg'
        expect(isImageUrl(url)).toBe(true)
    })

    it('should return false for a non-image URL', () => {
        const url = 'https://example.com/document.pdf'
        expect(isImageUrl(url)).toBe(false)
    })

    it('should return false for an empty string', () => {
        const url = ''
        expect(isImageUrl(url)).toBe(false)
    })

    it('should be case-insensitive', () => {
        const url = 'https://example.com/image.JPG'
        expect(isImageUrl(url)).toBe(true)
    })
})

describe('deepOmit', () => {
    it('should return the same object if the input is not an object', () => {
        const input = 42
        const props = ['foo']
        const result = deepOmit(input, props)
        expect(result).toBe(input)
    })

    it('should return null if the input is null', () => {
        const input = null
        const props = ['foo']
        const result = deepOmit(input, props)
        expect(result).toBeNull()
    })

    it('should remove the specified properties from the object', () => {
        const input = { foo: 1, bar: 2, baz: 3 }
        const props = ['foo', 'baz']
        const expected = { bar: 2 }
        const result = deepOmit(input, props)
        expect(result).toEqual(expected)
    })

    it('should remove the specified properties from nested objects', () => {
        const input = { foo: 1, bar: { baz: 2, qux: 3 }, quux: { corge: 4, grault: 5 } }
        const props = ['foo', 'grault']
        const expected = { bar: { baz: 2, qux: 3 }, quux: { corge: 4 } }
        const result = deepOmit(input, props)
        expect(result).toEqual(expected)
    })

    it('should remove the specified properties from nested arrays', () => {
        const input = { foo: 1, bar: [{ baz: 2 }, { qux: 3 }] }
        const props = ['foo', 'baz']
        const expected = { bar: [{}, { qux: 3 }] }
        const result = deepOmit(input, props)
        expect(result).toEqual(expected)
    })
})

describe('deepTrim', () => {
    it('should return the same value if the input is not an object', () => {
        const input = 42
        const result = deepTrim(input)
        expect(result).toBe(input)
    })

    it('should return null if the input is null', () => {
        const input = null
        const result = deepTrim(input)
        expect(result).toBeNull()
    })

    it('should trim leading and trailing whitespace from string values', () => {
        const input = { foo: '  bar  ', baz: 'qux' }
        const expected = { foo: 'bar', baz: 'qux' }
        const result = deepTrim(input)
        expect(result).toEqual(expected)
    })

    it('should trim whitespace from nested string values', () => {
        const input = { foo: '  bar  ', nested: { baz: '  qux  ' } }
        const expected = { foo: 'bar', nested: { baz: 'qux' } }
        const result = deepTrim(input)
        expect(result).toEqual(expected)
    })

    it('should not modify non-string values', () => {
        const input = { foo: 42, bar: true, baz: null }
        const expected = { foo: 42, bar: true, baz: null }
        const result = deepTrim(input)
        expect(result).toEqual(expected)
    })

    it('should handle nested objects and arrays', () => {
        const input = { foo: '  bar  ', nested: { baz: '  qux  ' }, arr: ['  hello  ', '  world  '] }
        const expected = { foo: 'bar', nested: { baz: 'qux' }, arr: ['hello', 'world'] }
        const result = deepTrim(input)
        expect(result).toEqual(expected)
    })
})

describe('mdToCqcode', () => {
    it('should convert Markdown image syntax to CQImage', () => {
        const markdown = '![Alt Text](https://example.com/image.jpg)'
        const expected = '[CQ:image,file=https://example.com/image.jpg,cache=0]'
        expect(mdToCqcode(markdown)).toBe(expected)
    })

    it('should convert HTML <img> tag to CQImage', () => {
        const markdown = '<img src="https://example.com/image.png" alt="Alt Text">'
        const expected = '[CQ:image,file=https://example.com/image.png,cache=0]'
        expect(mdToCqcode(htmlToMarkdown(markdown))).toBe(expected)
    })

    it('should handle multiple images', () => {
        const markdown = '![Alt Text 1](https://example.com/image1.jpg)\n\n![Alt Text 2](https://example.com/image2.png)'
        const expected = '[CQ:image,file=https://example.com/image1.jpg,cache=0]\n\n[CQ:image,file=https://example.com/image2.png,cache=0]'
        expect(mdToCqcode(markdown)).toBe(expected)
    })

    it('should preserve non-image text', () => {
        const markdown = 'This is some text.\n\n![Alt Text](https://example.com/image.jpg)\n\nMore text.'
        const expected = 'This is some text.\n\n[CQ:image,file=https://example.com/image.jpg,cache=0]\n\nMore text.'
        expect(mdToCqcode(markdown)).toBe(expected)
    })
})

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
        expect(() => dataFormat(-1)).toThrow('Data must be greater than or equal to 0')
        expect(() => dataFormat(-100)).toThrow('Data must be greater than or equal to 0')
        expect(() => dataFormat(-1024)).toThrow('Data must be greater than or equal to 0')
        expect(() => dataFormat(-1n)).toThrow('Data must be greater than or equal to 0')
        expect(() => dataFormat(-100n)).toThrow('Data must be greater than or equal to 0')
        expect(() => dataFormat(-1024n)).toThrow('Data must be greater than or equal to 0')
    })
})

describe('parseDataSize', () => {
    it('should return the input number as is', () => {
        expect(parseDataSize(1024)).toBe(1024)
    })

    it('should be able to parse KiB', () => {
        expect(parseDataSize('1 KiB')).toBe(1024)
    })

    it('should be able to parse KB', () => {
        expect(parseDataSize('1 KB')).toBe(1000)
    })
})

describe('splitString', () => {
    it('should split a string into chunks of specified length', () => {
        const str = 'This is a long string that needs to be split into smaller chunks.'
        const maxLength = 10
        const expected = [
            'This is a ',
            'long strin',
            'g that nee',
            'ds to be s',
            'plit into ',
            'smaller ch',
            'unks.',
        ]

        const result = splitString(str, maxLength)

        expect(result).toEqual(expected)
    })

    it('should handle empty strings', () => {
        const str = ''
        const maxLength = 5
        const expected = ['']

        const result = splitString(str, maxLength)

        expect(result).toEqual(expected)
    })

    it('should handle strings shorter than maxLength', () => {
        const str = 'short'
        const maxLength = 10
        const expected = ['short']

        const result = splitString(str, maxLength)

        expect(result).toEqual(expected)
    })

    it('should return an array with the original string when maxLength is 0', () => {
        const str = 'This is a long string'
        const maxLength = 0
        const expected = [str]

        const result = splitString(str, maxLength)

        expect(result).toEqual(expected)
    })

    it('should return an array with the original string when maxLength is negative', () => {
        const str = 'This is a long string'
        const maxLength = -5
        const expected = [str]

        const result = splitString(str, maxLength)

        expect(result).toEqual(expected)
    })
})

describe('timeFromNow', () => {
    it('should format time correctly', () => {
        expect(timeFromNow(1000)).toBe('1.00 seconds')
        expect(timeFromNow(60000)).toBe('1.00 minutes')
        expect(timeFromNow(3600000)).toBe('1.00 hours')
        expect(timeFromNow(86400000)).toBe('1.00 days')
        expect(timeFromNow(1234)).toBe('1.23 seconds')
        expect(timeFromNow(12345)).toBe('12.35 seconds')
        expect(timeFromNow(123456)).toBe('2.06 minutes')
        expect(timeFromNow(1234567)).toBe('20.58 minutes')
        expect(timeFromNow(12345678)).toBe('3.43 hours')
        expect(timeFromNow(123456789)).toBe('1.43 days')
        expect(timeFromNow(1234567890)).toBe('14.29 days')
    })
})

describe('collapseWhitespace', () => {
    it('should collapse and trim whitespace', () => {
        expect(collapseWhitespace('   hello   world   ')).toBe('hello world')
        expect(collapseWhitespace('   hello\t\n\r   world   ')).toBe('hello world')
        expect(collapseWhitespace('   hello   \t\n\r   world   ')).toBe('hello world')
        expect(collapseWhitespace('hello world')).toBe('hello world')
        expect(collapseWhitespace('')).toBe('')
        expect(collapseWhitespace(null)).toBeNull()
        expect(collapseWhitespace(undefined)).toBeUndefined()
    })
})

describe('escapeMarkdown', () => {
    it('should escape backticks', () => {
        expect(escapeMarkdown('`code`')).toBe('\\`code\\`')
    })

    it('should escape asterisks', () => {
        expect(escapeMarkdown('*italic*')).toBe('\\*italic\\*')
    })

    it('should escape underscores', () => {
        expect(escapeMarkdown('_italic_')).toBe('\\_italic\\_')
    })

    it('should escape hashes', () => {
        expect(escapeMarkdown('# Title')).toBe('\\# Title')
    })

    it('should escape backslashes', () => {
        expect(escapeMarkdown('\\backslash')).toBe('\\\\backslash')
    })

    it('should escape square brackets', () => {
        expect(escapeMarkdown('[link]')).toBe('\\[link\\]')
    })

    it('should escape parentheses', () => {
        expect(escapeMarkdown('(url)')).toBe('\\(url\\)')
    })

    it('should escape exclamation marks', () => {
        expect(escapeMarkdown('!image')).toBe('\\!image')
    })

    it('should escape curly braces', () => {
        expect(escapeMarkdown('{content}')).toBe('\\{content\\}')
    })

    it('should escape pipes', () => {
        expect(escapeMarkdown('|table|')).toBe('\\|table\\|')
    })

    it('should escape less than and greater than signs', () => {
        expect(escapeMarkdown('<tag>')).toBe('&lt;tag&gt;')
    })

    it('should escape ampersands', () => {
        expect(escapeMarkdown('AT&T')).toBe('AT&amp;T')
    })
})

describe('unescapeMarkdown', () => {
    it('should unescape backticks', () => {
        expect(unescapeMarkdown('\\`code\\`')).toBe('`code`')
    })

    it('should unescape asterisks', () => {
        expect(unescapeMarkdown('\\*italic\\*')).toBe('*italic*')
    })

    it('should unescape underscores', () => {
        expect(unescapeMarkdown('\\_italic\\_')).toBe('_italic_')
    })

    it('should unescape hashes', () => {
        expect(unescapeMarkdown('\\# Title')).toBe('# Title')
    })

    it('should unescape backslashes', () => {
        expect(unescapeMarkdown('\\\\backslash')).toBe('\\backslash')
    })

    it('should unescape square brackets', () => {
        expect(unescapeMarkdown('\\[link\\]')).toBe('[link]')
    })

    it('should unescape parentheses', () => {
        expect(unescapeMarkdown('\\(url\\)')).toBe('(url)')
    })

    it('should unescape exclamation marks', () => {
        expect(unescapeMarkdown('\\!image')).toBe('!image')
    })

    it('should unescape curly braces', () => {
        expect(unescapeMarkdown('\\{content\\}')).toBe('{content}')
    })

    it('should unescape pipes', () => {
        expect(unescapeMarkdown('\\|table\\|')).toBe('|table|')
    })

    it('should unescape less than and greater than signs', () => {
        expect(unescapeMarkdown('&lt;tag&gt;')).toBe('<tag>')
    })

    it('should unescape ampersands', () => {
        expect(unescapeMarkdown('AT&amp;T')).toBe('AT&T')
    })
})

describe('splitStringWithLineBreak', () => {
    it('should return an array with the original string if maxLength is 0 or negative', () => {
        expect(splitStringWithLineBreak('', 0)).toEqual([''])
        expect(splitStringWithLineBreak('test', -1)).toEqual(['test'])
    })

    it('should return an array with the original string if the input string is empty', () => {
        expect(splitStringWithLineBreak('', 10)).toEqual([''])
    })

    it('should split the string into chunks of the specified maxLength', () => {
        const str = 'Hello, world!\nThis is a test.\nAnother line.'
        const maxLength = 20
        const result = splitStringWithLineBreak(str, maxLength)
        expect(result).toEqual([
            'Hello, world!\n',
            'This is a test.\n',
            'Another line.',
        ])
    })

    it('should handle strings without line breaks', () => {
        const str = 'This is a test without line breaks.'
        const maxLength = 10
        const result = splitStringWithLineBreak(str, maxLength)
        expect(result).toEqual([
            'This is a ',
            'test witho',
            'ut line br',
            'eaks.',
        ])
    })

    it('should handle strings with multiple consecutive line breaks', () => {
        const str = 'Line 1\n\nLine 2\n\nLine 3'
        const maxLength = 10
        const result = splitStringWithLineBreak(str, maxLength)
        expect(result).toEqual([
            'Line 1\n\n',
            'Line 2\n\n',
            'Line 3',
        ])
    })

    it('should handle strings with trailing line breaks', () => {
        const str = 'Line 1\nLine 2\nLine 3\n'
        const maxLength = 10
        const result = splitStringWithLineBreak(str, maxLength)
        expect(result).toEqual([
            'Line 1\n',
            'Line 2\n',
            'Line 3\n',
        ])
    })

    it('should handle strings with leading line breaks', () => {
        const str = '\nLine 1\nLine 2\nLine 3'
        const maxLength = 10
        const result = splitStringWithLineBreak(str, maxLength)
        expect(result).toEqual([
            '\nLine 1\n',
            'Line 2\n',
            'Line 3',
        ])
    })

    it('should handle strings with mixed content', () => {
        const str = 'This is a test.\nAnother line with more text.\nAnd another line.'
        const maxLength = 20
        const result = splitStringWithLineBreak(str, maxLength)
        expect(result).toEqual([
            'This is a test.\n',
            'Another line with more text.\n',
            'And another line.',
        ])
    })
})

// describe('isJunkEmail', () => {
//     it('should return false for a valid email (normal user)', () => {
//         const result = isJunkEmail('example@gmail.com')
//         expect(result).toBe(false)
//     })

//     it('should return true for another valid email (normal user)', () => {
//         const result = isJunkEmail('another.valid@example.com')
//         expect(result).toBe(true)
//     })

//     it('should return false for an invalid email (junk email)', () => {
//         const result = isJunkEmail('invalid@example')
//         expect(result).toBe(false)
//     })

//     it('should return false for an empty string', () => {
//         const result = isJunkEmail('')
//         expect(result).toBe(false)
//     })

//     it('should return false for a non-email string', () => {
//         const result = isJunkEmail('not-an-email')
//         expect(result).toBe(false)
//     })
// })

describe('transformQueryOperator', () => {
    it('should transform operators correctly', () => {
        const mockWhere = {
            name: { $op: 'Like', value: 'John' },
            age: { $op: 'Between', value: [18, 30] },
            status: { $op: 'Equal', value: 'active' },
            tags: { $op: 'In', value: ['tag1', 'tag2'] },
            description: { $op: 'ILike', value: 'example' },
        }

        const result = transformQueryOperator(mockWhere)
        expect(result).toEqual({
            name: Like('John'),
            age: Between(18, 30),
            status: Equal('active'),
            tags: In(['tag1', 'tag2']),
            description: ILike('example'),
        })
    })

    it('should return basic types as is', () => {
        const mockWhere = {
            name: 'John',
            age: 25,
            isActive: true,
        }

        const result = transformQueryOperator(mockWhere)
        expect(result).toEqual(mockWhere)
    })

    it('should handle unknown operators as is', () => {
        const mockWhere = {
            name: { $op: 'UnknownOp', value: 'John' },
        }

        const result = transformQueryOperator(mockWhere)
        expect(result).toEqual(mockWhere)
    })
})
