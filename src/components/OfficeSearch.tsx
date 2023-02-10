import React from 'react';
import { SearchForm } from './SearchForm/SearchForm';
import { BodyLong, Heading } from '@navikt/ds-react';
import { LocaleString } from '../localization/LocaleString';

import style from './OfficeSearch.module.css';

export const OfficeSearch = () => {
    return (
        <div role={'main'} className={style.appContainer}>
            <Heading size={'xlarge'} className={style.title}>
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
