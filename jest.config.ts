import type { Config } from 'jest'

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
    // coverageDirectory: './coverage',
    testEnvironment: 'node',
}

export default config
