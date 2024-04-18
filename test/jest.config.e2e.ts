import path from 'path'
import type { Config } from 'jest'

const config: Config = {
    moduleFileExtensions: [
        'js',
        'json',
        'ts',
    ],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.e2e-test.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/../src/$1',
    },
    coverageDirectory: path.resolve('coverage'),
}

export default config
