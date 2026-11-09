import { defineConfig } from 'oxfmt';

export default defineConfig({
	printWidth: 120,
	useTabs: true,
	tabWidth: 2,
	singleQuote: true,
	trailingComma: 'all',
	ignorePatterns: [
		'**/dist',
		'pnpm-lock.yaml',
		// Handlebars templates: oxfmt fails on them and would turn {{image}} into { { image } }
		'.nais/**',
		'test/fixtures/**',
		'**/__goldens__/**',
		'**/__snapshots__/**',
		'wcag-rapport.json',
	],
});
