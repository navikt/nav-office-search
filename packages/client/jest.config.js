/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '.+\\.(css)$': 'identity-obj-proxy',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: {
                    module: 'CommonJS',
                    moduleResolution: 'node10',
                    esModuleInterop: true,
                    jsx: 'react-jsx',
                    target: 'ES2022',
                    isolatedModules: true,
                    resolveJsonModule: true,
                    skipLibCheck: true,
                    strict: true,
                    types: ['jest', '@testing-library/jest-dom'],
                    ignoreDeprecations: '6.0',
                },
            },
        ],
    },
};
