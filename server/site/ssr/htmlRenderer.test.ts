import { beforeEach, expect, test, vi } from 'vitest';
import { pageRenders, registry } from '#server/metrics/metrics.ts';
import { fetchDecorator } from './document.ts';
import { prodRenderer } from './htmlRenderer.ts';

vi.mock('./document.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('./document.ts')>()),
	fetchDecorator: vi.fn(),
}));

const decorator = {
	DECORATOR_HEAD_ASSETS: '',
	DECORATOR_HEADER: '<div id="decorator-header"></div>',
	DECORATOR_FOOTER: '',
	DECORATOR_SCRIPTS: '',
};

const renderCounts = async () => (await pageRenders.get()).values.map(({ labels, value }) => ({ ...labels, value }));

beforeEach(() => {
	registry.resetMetrics();
	vi.mocked(fetchDecorator).mockReset();
	vi.mocked(fetchDecorator).mockResolvedValue(decorator);
});

test('refuses to start when the app renders nothing', () => {
	expect(() => prodRenderer(() => '', [])).toThrow('gave no markup');
});

test('puts the app and the decorator into the page, per locale', async () => {
	const render = prodRenderer((locale) => `<div>${locale}</div>`, []);

	const page = await render('nn');

	expect(page).toContain('<html lang="nn">');
	expect(page).toContain('<main id="maincontent" tabindex="-1"><div>nn</div></main>');
	expect(page).toContain('<div id="decorator-header"></div>');
	expect(vi.mocked(fetchDecorator).mock.calls).toEqual([['nn']]);
	expect(await renderCounts()).toEqual([{ locale: 'nn', outcome: 'ssr', value: 1 }]);
});

test('renders the app once per locale at the start, however many pages are asked for', async () => {
	const renderApp = vi.fn((locale: string) => `<div>${locale}</div>`);
	const render = prodRenderer(renderApp, []);

	await render('nb');
	await render('en');
	await render('nb');

	expect(renderApp.mock.calls.flat()).toEqual(['nb', 'nn', 'en']);
	expect(await renderCounts()).toEqual([
		{ locale: 'nb', outcome: 'ssr', value: 2 },
		{ locale: 'en', outcome: 'ssr', value: 1 },
	]);
});

test('takes the decorator for every request, so a new one shows on the next', async () => {
	const render = prodRenderer((locale) => `<div>${locale}</div>`, []);

	const first = await render('nb');
	vi.mocked(fetchDecorator).mockResolvedValue({ ...decorator, DECORATOR_HEADER: '<div id="new-header"></div>' });
	const second = await render('nb');

	expect(first).toContain('<div id="decorator-header"></div>');
	expect(second).toContain('<div id="new-header"></div>');
	expect(second).not.toContain('<div id="decorator-header"></div>');
	expect(vi.mocked(fetchDecorator).mock.calls).toEqual([['nb'], ['nb']]);
});

test('counts no page when the decorator can not be had', async () => {
	vi.mocked(fetchDecorator).mockRejectedValue(new Error('No decorator'));
	const render = prodRenderer((locale) => `<div>${locale}</div>`, []);

	await expect(render('nb')).rejects.toThrow('No decorator');
	expect(await renderCounts()).toEqual([]);
});
