import { localeModuleNb } from './modules/nb-default';
import { localeModuleNn } from './modules/nn';
import { localeModuleEn } from './modules/en';
import { AppLocale, LocaleModule, LocaleStringId } from './types';

const localeModules: { [key in AppLocale]: LocaleModule } = {
    nb: localeModuleNb,
    nn: localeModuleNn,
    en: localeModuleEn,
};

export const localeString = (
    id: LocaleStringId,
    locale: AppLocale,
    args: string[] = []
) => {
    const value = localeModules[locale][id];
    return typeof value === 'function'
        ? value(...(args as [string, string, string]))
        : value;
};
