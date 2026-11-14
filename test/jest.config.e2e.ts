import path from 'path'
import type { Config } from 'jest'
import { transform, transformIgnorePatterns } from '../jest.shared'

const config: Config = {
    moduleFileExtensions: [
        'js',
        'json',
        'ts',
    ],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.e2e-test.ts$',
    transform,
    transformIgnorePatterns,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/../src/$1',
    },
    coverageDirectory: path.resolve('coverage'),
}

export default config
