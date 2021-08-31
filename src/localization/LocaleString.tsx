import React from 'react';
import { localeNb } from './nb-default';

type LocaleModule = typeof localeNb;
type LocaleStringId = keyof LocaleModule;

type Locale = 'nb';

const localeModules: { [key in Locale]: LocaleModule } = {
    nb: localeNb,
};

type Props = {
    id: LocaleStringId;
};

export const LocaleString = ({ id }: Props) => {
    const language = 'nb';

    return (
        <>{localeModules[language][id] || `[Feil: mangler tekst for ${id}]`}</>
    );
};
