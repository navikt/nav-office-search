import React from 'react';
import { LocaleModule, localeModuleNb, LocaleStringId } from './nb-default';
import { localeModuleEn } from './en';

export type Locale = 'nb' | 'en';

const defaultLocale: Locale = 'nb';

const localeModules: { [key in Locale]: LocaleModule } = {
    nb: localeModuleNb,
    en: localeModuleEn,
};

type Props = {
    id: LocaleStringId;
    args?: string[];
};

export const localeString = (
    id: Props['id'],
    locale: Locale = defaultLocale,
    args: Props['args'] = []
): string => {
    const value = localeModules[locale][id] || localeModules[defaultLocale][id];
    if (!value) {
        return id;
    }

    const finalValue = typeof value === 'function' ? value(...args) : value;

    return typeof finalValue === 'string' ? finalValue : id;
};

export const LocaleString = ({ id, args = [] }: Props) => {
    const locale = defaultLocale as Locale;

    const value = localeModules[locale][id] || localeModules[defaultLocale][id];
    if (!value) {
        return <>{id}</>;
    }

    const finalValue = typeof value === 'function' ? value(...args) : value;

    return <>{finalValue}</>;
};
