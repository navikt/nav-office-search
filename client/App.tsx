import React, { useEffect, useState } from 'react';
// Import global style early to ensure the later component-level imports
// gets higher specificity
import './global.css';
import { OfficeSearch } from './components/OfficeSearch.tsx';
import { LocaleProvider } from './localization/useLocale.tsx';
import type { AppLocale } from '#shared/localization/types.ts';
import { onLanguageSelect, setParams } from '@navikt/nav-dekoratoren-moduler';
import { getDecoratorParams } from '#shared/decoratorParams.ts';
import { clientUrls } from './urls.ts';
import { localeString } from '#shared/localization/localeString.ts';

type Props = { locale?: AppLocale };

export const App = ({ locale = 'nb' }: Props) => {
	const [currentLocale, setCurrentLocale] = useState<AppLocale>(locale);

	useEffect(() => {
		const updateLanguageState = (newLocale: AppLocale) => {
			setCurrentLocale(newLocale);
			window.history.replaceState(window.history.state, '', clientUrls.appPath[newLocale]);
			document.documentElement.lang = newLocale;
			document.title = localeString('documentTitle', newLocale) as string;
			setParams(getDecoratorParams(newLocale));
		};

		onLanguageSelect((language) => {
			updateLanguageState(language.locale as AppLocale);
		});
	}, []);

	return (
		<LocaleProvider value={currentLocale}>
			<OfficeSearch />
		</LocaleProvider>
	);
};
