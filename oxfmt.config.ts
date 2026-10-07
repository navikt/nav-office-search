import { defineConfig } from 'oxfmt';

export default defineConfig({
	printWidth: 120,
	useTabs: true,
	tabWidth: 2,
	singleQuote: true,
	trailingComma: 'all',
	ignorePatterns: [
		'**/dist',
		'**/frontendDist',
		'pnpm-lock.yaml',
		// Handlebars templates: oxfmt fails on them and would turn {{image}} into { { image } }
		'.nais/**',
		// <main id="maincontent"><!--ssr-app-html--></main> must stay byte-adjacent
		'packages/client/index.html',
		'packages/server/src/_mock/data/**',
		'test/fixtures/**',
		'**/__goldens__/**',
		'**/__snapshots__/**',
		'wcag-rapport.json',
	],
});
