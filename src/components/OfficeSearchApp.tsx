import React, { useState } from 'react';
import style from './OfficeSearchApp.module.css';
import { SearchForm } from './SearchForm/SearchForm';
import { BodyLong, Title } from '@navikt/ds-react';
import { LocaleString } from '../localization/LocaleString';

export const OfficeSearchApp = () => {
    const [submittedResult, setSubmittedResult] = useState();

    return (
        <div className={style.appContainer}>
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
