import { expect, test } from 'vitest';
import { getDecoratorParams } from './decoratorParams';

test.each(['nb', 'nn', 'en'] as const)('decorator params for %s', (locale) => {
	expect(getDecoratorParams(locale)).toEqual({
		context: 'privatperson',
		language: locale,
		availableLanguages: [
			{ locale: 'nb', handleInApp: true },
			{ locale: 'nn', handleInApp: true },
			{ locale: 'en', handleInApp: true },
		],
	});
});
