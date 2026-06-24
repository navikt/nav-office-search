import { localeModuleNb } from './modules/nb-default';

export type AppLocale = 'nb' | 'nn' | 'en';

export type LocaleModule = typeof localeModuleNb;
export type LocaleStringId = keyof LocaleModule;
export type ErrorType = 'clientError' | 'serverError';
export type SearchError = { id: LocaleStringId; type: ErrorType };
