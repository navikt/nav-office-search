import React from 'react';
import { SearchForm } from './SearchForm/SearchForm';
import { BodyLong, Heading } from '@navikt/ds-react';
import { LocaleString } from '../localization/LocaleString';
import { useLoginStatus } from '../hooks/useLoginStatus';

import style from './OfficeSearch.module.css';

export const OfficeSearch = () => {
    const { isUserLoggedIn } = useLoginStatus();

    return (
        <div className={style.appContainer}>
            <Heading size={'xlarge'} className={style.title}>
                <LocaleString id={'pageTitle'} />
            </Heading>
            {isUserLoggedIn !== null && (
                <BodyLong>
                    {isUserLoggedIn ? 'You are logged in' : 'You are not logged in'}
                </BodyLong>
            )}
            <BodyLong className={style.ingress}>
                <LocaleString id={'ingressLine1'} />
                <br />
                <LocaleString id={'ingressLine2'} />
            </BodyLong>
            <SearchForm />
        </div>
    );
};
