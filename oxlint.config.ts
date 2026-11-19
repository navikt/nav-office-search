import { defineConfig } from 'oxlint';

export default defineConfig({
	plugins: ['typescript', 'unicorn', 'oxc', 'react', 'jsx-a11y', 'vitest', 'promise'],
	categories: { correctness: 'error', suspicious: 'error', perf: 'error' },
	options: { reportUnusedDisableDirectives: 'warn', typeAware: true },
	rules: {
		'no-console': 'error',
		'typescript/no-explicit-any': 'error',
		// Under pedantic, and react/hooks misses hooks called from plain functions
		'react/rules-of-hooks': 'error',
		// It would flag the leading _ that marks a variable as unused
		'no-underscore-dangle': 'off',
		// The automatic JSX runtime needs no React in scope
		'react/react-in-jsx-scope': 'off',
		// The search field is a combobox with a listbox of its own, which <select> and <datalist> can't be
		'jsx-a11y/prefer-tag-over-role': 'off',
		// Test helpers stay next to the tests that use them
		'unicorn/consistent-function-scoping': 'off',
		// The implementations give the mocks their types
		'vitest/require-mock-type-parameters': 'off',
		// Helpers like expectNotFound() hold a test's assertions
		'vitest/expect-expect': ['error', { assertFunctionNames: ['expect', 'expect*'] }],
		// It would flag every deliberate cast, like document.activeElement as HTMLElement
		'typescript/no-unsafe-type-assertion': 'off',
		// It wants a return after a switch that has every case, and after process.exit(). tsc checks that every path returns
		'typescript/consistent-return': 'off',
		// toSorted() needs Chrome 110, and Nav's supported browsers (@navikt/browserslist-config) go back to Chrome 108
		'unicorn/no-array-sort': 'off',
	},
	overrides: [
		{
			// The browser has no logger, and server/utils/console.ts is where the server's console is sent to its logger
			files: ['client/**', 'server/utils/console.ts', 'server/utils/console.test.ts'],
			rules: { 'no-console': 'off' },
		},
		{
			// A test does one thing at a time, in the order its mock answers, and its helpers needn't be fast
			files: ['**/*.test.ts', '**/*.test.tsx'],
			rules: { 'no-await-in-loop': 'off', 'oxc/no-map-spread': 'off' },
		},
	],
});
