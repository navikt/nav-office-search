import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';

export default tseslint.config(
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/frontendDist/**',
            '**/build/**',
            '**/frontendDist/**',
            '**/*.config.js',
            '**/*.config.ts',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        ...eslintReact.configs['recommended-typescript'],
        settings: {
            'react-x': {
                // 'detect' fails to find React's version because eslint runs from the
                // repo root, not packages/client, so it must be pinned explicitly here.
                // Keep this in sync with the "react" version in packages/client/package.json.
                version: '18.3.1',
            },
        },
        rules: {
            ...eslintReact.configs['recommended-typescript'].rules,
            '@eslint-react/no-use-context': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_$',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
        },
    }
);
