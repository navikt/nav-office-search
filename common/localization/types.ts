import { localeModuleNb } from './modules/nb-default';

export type AppLocale = 'nb' | 'en';

export type LocaleModule = typeof localeModuleNb;
export type LocaleStringId = keyof LocaleModule;
