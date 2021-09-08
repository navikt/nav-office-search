import React from 'react';
import { localeNb, LocaleStringId } from './nb-default';

type LocaleModule = typeof localeNb;

type Locale = 'nb';

const localeModules: { [key in Locale]: LocaleModule } = {
    nb: localeNb,
};

type Props = {
    id: LocaleStringId;
    args?: string[];
};

export const localeString = (
    id: Props['id'],
    locale: Locale = 'nb',
    args: Props['args'] = []
) => {
    const value = localeModules[locale][id];
    if (!value) {
        return id;
    }

    return typeof value === 'function' ? value(...args) : value;
};

export const LocaleString = ({ id, args }: Props) => {
    return <>{localeString(id, 'nb', args)}</>;
};
