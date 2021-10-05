import React, { useEffect } from 'react';
import { SearchForm } from './SearchForm/SearchForm';
import { BodyLong, Heading } from '@navikt/ds-react';
import { Locale, LocaleString } from '../localization/LocaleString';
import { useRouter } from 'next/router';
import { onLanguageSelect, setParams } from '@navikt/nav-dekoratoren-moduler';
import { getDecoratorParams } from '../utils/decoratorParams';
import style from './OfficeSearchApp.module.css';

export const OfficeSearchApp = () => {
    const router = useRouter();
    const locale = router.locale as Locale;

    useEffect(() => {
        onLanguageSelect((language) => {
            router.push('/', '/', { locale: language.locale });
        });
    }, [router]);

    useEffect(() => {
        setParams(getDecoratorParams(locale));
    }, [locale]);

    return (
        <div className={style.appContainer}>
            <Heading size={'2xlarge'} className={style.title}>
                <LocaleString id={'pageTitle'} />
            </Heading>
            <BodyLong className={style.ingress}>
                <LocaleString id={'ingressLine1'} />
                <br />
                <LocaleString id={'ingressLine2'} />
            </BodyLong>
            <SearchForm />
        </div>
    );
};
