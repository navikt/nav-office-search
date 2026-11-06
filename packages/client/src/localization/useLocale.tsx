import React, { createContext, useContext } from 'react';
import { Provider } from '@navikt/ds-react';
import { en, nb, nn } from '@navikt/ds-react/locales';
import type { AppLocale } from '../../../common/localization/types';

const LocaleContext = createContext<AppLocale>('nb');

// For Aksel's own strings, like the search field's clear button
const akselLocales = { nb, nn, en };

export const useLocale = () => {
	return useContext(LocaleContext);
};

type LocaleProviderProps = { value: AppLocale; children: React.ReactNode };

export const LocaleProvider = ({ value, children }: LocaleProviderProps) => {
	return (
		<LocaleContext value={value}>
			<Provider locale={akselLocales[value]}>{children}</Provider>
		</LocaleContext>
	);
};
