import { expect, test, vi } from 'vitest';
import { assertRenderable } from './selfCheck.ts';

test('accepts an app that renders every locale', () => {
	const render = vi.fn((locale: string) => `<div>${locale}</div>`);

	expect(() => assertRenderable(render)).not.toThrow();
	expect(render.mock.calls.flat()).toEqual(['nb', 'nn', 'en']);
});

test('rejects an app that renders nothing for a locale, and says which', () => {
	expect(() => assertRenderable((locale) => (locale === 'nn' ? '' : '<div></div>'))).toThrow('the nn page');
});

test('lets a render that throws stop the boot', () => {
	const failing = () => {
		throw new Error('Rendering failed');
	};

	expect(() => assertRenderable(failing)).toThrow('Rendering failed');
});
