import { localeModuleNb } from './modules/nb-default';
import { localeModuleEn } from './modules/en';
import {
    AppLocale,
    defaultLocale,
    LocaleModule,
    LocaleStringId,
} from './types';

const localeModules: { [key in AppLocale]: LocaleModule } = {
    nb: localeModuleNb,
    en: localeModuleEn,
};

export const localeString = (
    id: LocaleStringId,
    locale: AppLocale = defaultLocale,
    args: string[] = []
): string => {
    const value = localeModules[locale][id] || localeModules[defaultLocale][id];
    if (!value) {
        return id;
    }

    const finalValue = typeof value === 'function' ? value(...args) : value;

    return typeof finalValue === 'string' ? finalValue : id;
};
