import { check } from '@itsy/html/check';
import { expect, test } from 'vitest';
import { builtAssets, devAssets, renderDocument } from './document.ts';

const decorator = {
	DECORATOR_HEAD_ASSETS: '<link rel="stylesheet" href="https://decorator.test/client.css">',
	DECORATOR_HEADER: '<div id="decorator-header"></div>',
	DECORATOR_FOOTER: '<div id="decorator-footer"></div>',
	DECORATOR_SCRIPTS: '<script src="https://decorator.test/client.js"></script>',
};

const assets = builtAssets({
	'client/main-client.tsx': { file: 'assets/index-abc.js', css: ['assets/index-def.css'] },
});

const page = (locale: 'nb' | 'nn' | 'en' = 'nb', appHtml = '<div>Appen</div>') =>
	renderDocument({ locale, assets, decorator, appHtml });

test('is a valid document', () => {
	// Guards the next line: this only finds anything in the library's development build
	expect(check('<div>')).not.toEqual([]);

	expect(check(page())).toEqual([]);
});

test('puts the markup right inside <main>, which the client hydrates', () => {
	expect(page()).toContain('<main id="maincontent" tabindex="-1"><div>Appen</div></main>');
});

test('leaves <main> empty without markup, so the client renders from scratch', () => {
	expect(page('nb', '')).toContain('<main id="maincontent" tabindex="-1"></main>');
});

test('inserts the markup literally, also what looks like a replacement pattern', () => {
	const markup = "<p>$& $1 $' 100 $</p>";

	expect(page('nb', markup)).toContain(`>${markup}</main>`);
});

test.each([
	['nb', 'https://www.nav.test/finn-nav-kontor', 'Finn Nav-kontor - nav.no'],
	['nn', 'https://www.nav.test/finn-nav-kontor/nn', 'Finn Nav-kontor - nav.no'],
	['en', 'https://www.nav.test/finn-nav-kontor/en', 'Find Nav office - nav.no'],
] as const)('describes the %s page', (locale, url, title) => {
	const html = page(locale);

	expect(html).toContain(`<html lang="${locale}">`);
	expect(html).toContain(`<title>${title}</title>`);
	expect(html).toContain(`<meta property="og:title" content="${title}">`);
	expect(html).toContain(`<meta property="og:url" content="${url}">`);
	expect(html).toContain('<meta property="og:site_name" content="nav.test">');
	expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
});

test('has the decorator last in head, first in body and last in body', () => {
	const html = page();

	expect(html).toContain(`${decorator.DECORATOR_HEAD_ASSETS}</head><body>${decorator.DECORATOR_HEADER}<main`);
	expect(html).toContain(`</main>${decorator.DECORATOR_FOOTER}${decorator.DECORATOR_SCRIPTS}</body></html>`);
});

test('refers to the built client and the favicon under the base path', () => {
	const html = page();

	expect(html).toContain('<link rel="shortcut icon" href="/finn-nav-kontor/favicon.ico">');
	expect(html).toContain('<script type="module" src="/finn-nav-kontor/assets/index-abc.js"></script>');
	expect(html).toContain('<link rel="stylesheet" href="/finn-nav-kontor/assets/index-def.css">');
});

test('handles a client build without a stylesheet', () => {
	expect(builtAssets({ 'client/main-client.tsx': { file: 'assets/index-abc.js' } })).toHaveLength(2);
});

test("won't start from a manifest without the client", () => {
	expect(() => builtAssets({})).toThrow('client/main-client.tsx is missing');
});

test('in development, refers to what Vite serves, which adds the base path itself', () => {
	const html = renderDocument({ locale: 'nb', assets: devAssets, decorator, appHtml: '' });

	expect(html).toContain('<link rel="shortcut icon" href="/favicon.ico">');
	expect(html).toContain('<script type="module" src="/client/main-client.tsx"></script>');
});
