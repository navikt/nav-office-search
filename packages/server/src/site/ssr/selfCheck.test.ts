import { describe, expect, test, vi } from 'vitest';
import { assertRenderable } from './selfCheck';

const template =
	'<html lang="%%LANG%%"><head><!--ssr-meta--></head><body><main id="maincontent"><!--ssr-app-html--></main></body></html>';

describe('assertRenderable', () => {
	test('renders every locale once', () => {
		const render = vi.fn(() => '<div></div>');

		assertRenderable(template, render);

		expect(render.mock.calls).toEqual([['nb'], ['nn'], ['en']]);
	});

	test.each(['%%LANG%%', '<!--ssr-meta-->', '<!--ssr-app-html-->', '</head>', '<body', '</body>'])(
		'throws when the template has no %s',
		(marker) => {
			expect(() => assertRenderable(template.replace(marker, ''), () => '<div></div>')).toThrow(
				`The page template is missing ${marker}`,
			);
		},
	);

	test('passes on an error from rendering', () => {
		const failure = new Error('render failed');

		expect(() =>
			assertRenderable(template, () => {
				throw failure;
			}),
		).toThrow(failure);
	});

	test('throws when a locale renders nothing', () => {
		expect(() => assertRenderable(template, (locale) => (locale === 'nn' ? '' : '<div></div>'))).toThrow(
			'Server rendering the nn page gave no markup',
		);
	});
});
