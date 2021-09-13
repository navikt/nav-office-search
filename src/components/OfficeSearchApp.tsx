import React, { useEffect } from 'react';
import { SearchForm } from './SearchForm/SearchForm';
import { Alert, BodyLong, Title } from '@navikt/ds-react';
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
            <Alert variant={'info'} size={'m'} style={{ marginBottom: '2rem' }}>
                {
                    'Hei! Denne tjenesten er under utvikling og er ikke helt klar for lansering ennå.'
                }
                {
                    ' Du er velkommen til å prøve ut tjenesten, men vær oppmerksom på at noe funksjonalitet kan være uferdig.'
                }
            </Alert>
            <Title size={'2xl'} className={style.title}>
                <LocaleString id={'pageTitle'} />
            </Title>
            <BodyLong className={style.ingress}>
                <LocaleString id={'ingressLine1'} />
                <br />
                <LocaleString id={'ingressLine2'} />
            </BodyLong>
            <SearchForm />
        </div>
    );
};
