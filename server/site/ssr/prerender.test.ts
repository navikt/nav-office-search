import { expect, test, vi } from 'vitest';
import { prerender } from './prerender.ts';

test('renders every locale once, and gives back the markup', () => {
	const render = vi.fn((locale: string) => `<div>${locale}</div>`);

	expect(prerender(render)).toEqual({ nb: '<div>nb</div>', nn: '<div>nn</div>', en: '<div>en</div>' });
	expect(render.mock.calls.flat()).toEqual(['nb', 'nn', 'en']);
});

test('rejects an app that renders nothing for a locale, and says which', () => {
	expect(() => prerender((locale) => (locale === 'nn' ? '' : '<div></div>'))).toThrow('the nn page');
});

test('lets a render that throws stop the boot', () => {
	const failing = () => {
		throw new Error('Rendering failed');
	};

	expect(() => prerender(failing)).toThrow('Rendering failed');
});
