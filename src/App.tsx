import React, { useEffect, useState } from 'react';
// Import global style early to ensure the later component-level imports
// gets higher specificity
import './global.css';
import { OfficeSearch } from './components/OfficeSearch';
import { LocaleProvider } from './localization/useLocale';
import { AppLocale } from '../common/localization/types';
import { onLanguageSelect, setParams } from '@navikt/nav-dekoratoren-moduler';
import { getDecoratorParams } from '../common/decoratorParams';
import { clientUrls } from './urls';

type Props = { locale?: AppLocale };

export const App = ({ locale = 'nb' }: Props) => {
    const [currentLocale, setCurrentLocale] = useState<AppLocale>(locale);

    useEffect(() => {
        onLanguageSelect((language) => {
            const newLocale = language.locale as AppLocale;
            setCurrentLocale(newLocale as AppLocale);
            window.history.replaceState(
                window.history.state,
                '',
                clientUrls.appPath[newLocale]
            );
            document.documentElement.lang = newLocale;
            setParams(getDecoratorParams(newLocale, clientUrls.kontaktOss));
        });
    }, []);

    return (
        <LocaleProvider value={currentLocale}>
            <OfficeSearch />
        </LocaleProvider>
    );
};
