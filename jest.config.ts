import path from 'path'
import type { Config } from 'jest'
import ms from 'ms'

const config: Config = {
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    moduleFileExtensions: [
        'js',
        'json',
        'ts',
    ],
    rootDir: 'src',
    testRegex: '.test.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    coverageDirectory: path.resolve('./coverage'),
    testEnvironment: 'node',
    testTimeout: ms('2m'),
}

export default config
