import React from 'react';
import { localeNb } from './nb-default';

type LocaleModule = typeof localeNb;
export type LocaleStringId = keyof LocaleModule;

type Locale = 'nb';

const localeModules: { [key in Locale]: LocaleModule } = {
    nb: localeNb,
};

type Props = {
    id: LocaleStringId;
};

export const localeString = (id: LocaleStringId, locale: Locale = 'nb') =>
    localeModules[locale][id] || `[Feil: mangler tekst for ${id}]`;

export const LocaleString = ({ id }: Props) => {
    return <>{localeString(id)}</>;
};
