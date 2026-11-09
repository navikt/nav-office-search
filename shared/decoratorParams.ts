import type { DecoratorParams } from '@navikt/nav-dekoratoren-moduler';
import type { AppLocale } from './localization/types.ts';

export const getDecoratorParams = (locale: AppLocale): DecoratorParams => ({
	context: 'privatperson',
	language: locale,
	availableLanguages: [
		{ locale: 'nb', handleInApp: true },
		{ locale: 'nn', handleInApp: true },
		{ locale: 'en', handleInApp: true },
	],
});
