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
            <div className={style.illustration}>
                <OfficeSearchIllustration />
            </div>
            <div className={style.content}>
                <Heading size={'xlarge'} level={'1'} spacing>
                    <LocaleString id={'pageTitle'} />
                </Heading>
                <BodyLong spacing>
                    <LocaleString id={'ingressLine1'} />
                </BodyLong>
                <BodyLong>
                    <LocaleString id={'ingressLine2'} />
                </BodyLong>
                <Button
                    variant={'secondary'}
                    as={'a'}
                    href={clientUrls.dittNavKontor(locale)}
                    className={style.loginButton}
                >
                    <LocaleString id={isUserLoggedIn ? 'loggedInButtonText' : 'loginButtonText'} />
                </Button>

                <Heading size={'medium'} level={'2'} spacing>
                    <LocaleString id={'searchSectionTitle'} />
                </Heading>
                <BodyLong spacing>
                    <LocaleString id={'searchSectionBody'} />
                </BodyLong>
                <SearchForm />
            </div>
        </div>
    );
};
