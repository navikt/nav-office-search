import type { localeModuleNb } from './modules/nb-default';

export const appLocales = ['nb', 'nn', 'en'] as const;

export type AppLocale = (typeof appLocales)[number];

export const isAppLocale = (value: string): value is AppLocale => appLocales.some((locale) => locale === value);

export type LocaleModule = typeof localeModuleNb;
export type LocaleStringId = keyof LocaleModule;
export type ErrorType = 'clientError' | 'serverError';
export type SearchError = { id: LocaleStringId; type: ErrorType };
