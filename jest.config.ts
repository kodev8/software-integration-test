import { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {}],
    },
    testTimeout: 150000,
    verbose: true,
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '.mockData.ts',
        '/boot/',
        '/config/',
    ],
    roots: ['<rootDir>/src'],
};

export default config;
