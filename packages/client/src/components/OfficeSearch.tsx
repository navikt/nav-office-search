import React from 'react';
import { SearchForm } from './SearchForm/SearchForm';
import { BodyLong, Button, Heading } from '@navikt/ds-react';
import { OfficeSearchIllustration } from './OfficeSearchIllustration/OfficeSearchIllustration';
import { LocaleString } from '../localization/LocaleString';
import { useLocale } from '../localization/useLocale';
import { useLoginStatus } from '../hooks/useLoginStatus';
import { clientUrls } from '../urls';

import style from './OfficeSearch.module.css';

export const OfficeSearch = () => {
    const { isUserLoggedIn } = useLoginStatus();
    const locale = useLocale();

    return (
        <div className={style.appContainer}>
            <div className={style.titleIllustration}>
                <OfficeSearchIllustration />
            </div>
            <div className={style.titleContent}>
                <Heading size={'xlarge'} level={'1'} className={style.title}>
                    <LocaleString id={'pageTitle'} />
                </Heading>
                <BodyLong className={style.ingress}>
                    <LocaleString id={'ingressLine1'} />
                </BodyLong>
            </div>

            <div className={style.section}>
                <Heading size={'medium'} level={'2'} className={style.sectionTitle}>
                    <LocaleString id={'loginSectionTitle'} />
                </Heading>
                <BodyLong className={style.sectionBody}>
                    <LocaleString id={'loginSectionBody'} />
                </BodyLong>
                <Button
                    variant={'primary'}
                    as={'a'}
                    href={clientUrls.dittNavKontor(locale)}
                    className={style.loginButton}
                >
                    <LocaleString id={isUserLoggedIn ? 'loggedInButtonText' : 'loginButtonText'} />
                </Button>
            </div>

            <div className={style.section}>
                <Heading size={'medium'} level={'2'} className={style.sectionTitle}>
                    <LocaleString id={'searchSectionTitle'} />
                </Heading>
                <BodyLong className={style.sectionBody}>
                    <LocaleString id={'searchSectionBody'} />
                </BodyLong>
                <SearchForm />
            </div>
        </div>
    );
};
