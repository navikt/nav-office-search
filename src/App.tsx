import React, { useEffect, useState } from 'react';
// Import global style early to ensure the later component-level imports
// gets higher specificity
import './global.css';
import { OfficeSearch } from './components/OfficeSearch';
import { LocaleProvider } from './localization/useLocale';
import { AppLocale } from '../src-common/localization/types';
import { onLanguageSelect, setParams } from '@navikt/nav-dekoratoren-moduler';
import { getDecoratorParams } from '../src-common/decoratorParams';

type Props = { locale?: AppLocale };

export const App = ({ locale = 'nb' }: Props) => {
    const [currentLocale, setCurrentLocale] = useState<AppLocale>(locale);

    let isFirstRender = true;

    useEffect(() => {
        onLanguageSelect((language) => {
            setCurrentLocale(language.locale as AppLocale);
        });
    }, []);

    useEffect(() => {
        if (isFirstRender) {
            isFirstRender = false;
            return;
        }
        setParams(getDecoratorParams(currentLocale));
    }, [currentLocale]);

    return (
        <LocaleProvider value={currentLocale}>
            <OfficeSearch />
        </LocaleProvider>
    );
};
