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

test('renders the app and the decorator into the page, per locale', async () => {
	const render = prodRenderer((locale) => `<div>${locale}</div>`, []);

	const page = await render('nn');

	expect(page).toContain('<html lang="nn">');
	expect(page).toContain('<main id="maincontent" tabindex="-1"><div>nn</div></main>');
	expect(page).toContain('<div id="decorator-header"></div>');
	expect(vi.mocked(fetchDecorator).mock.calls).toEqual([['nn']]);
	expect(await renderCounts()).toEqual([{ locale: 'nn', outcome: 'ssr', value: 1 }]);
});

test('keeps each locale for later requests', async () => {
	const render = prodRenderer((locale) => `<div>${locale}</div>`, []);

	const first = await render('nb');
	await render('en');

	expect(await render('nb')).toBe(first);
	expect(vi.mocked(fetchDecorator).mock.calls).toEqual([['nb'], ['en']]);
	expect(await renderCounts()).toEqual([
		{ locale: 'nb', outcome: 'ssr', value: 1 },
		{ locale: 'en', outcome: 'ssr', value: 1 },
	]);
});

test('when rendering fails, leaves it to the browser and tries again next time', async () => {
	const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
	const renderApp = vi
		.fn((locale: string) => `<div>${locale}</div>`)
		// The self-check at boot
		.mockReturnValueOnce('<div></div>')
		.mockReturnValueOnce('<div></div>')
		.mockReturnValueOnce('<div></div>')
		.mockImplementationOnce(() => {
			throw new Error('Rendering failed');
		});
	const render = prodRenderer(renderApp, []);

	expect(await render('nb')).toContain('<main id="maincontent" tabindex="-1"></main>');
	expect(await render('nb')).toContain('<div>nb</div>');
	expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Rendering failed'));
	expect(await renderCounts()).toEqual([
		{ locale: 'nb', outcome: 'csr_fallback', value: 1 },
		{ locale: 'nb', outcome: 'ssr', value: 1 },
	]);
});
