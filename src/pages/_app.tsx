import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Locale, localeString } from '../localization/LocaleString';
import { useRouter } from 'next/router';
import '../global.css';

const App = ({ Component, pageProps }: AppProps) => {
    const router = useRouter();

    return (
        <>
            <Head>
                <title>{`${localeString(
                    'pageTitle',
                    router.locale as Locale
                )} - nav.no`}</title>
            </Head>
            <Component {...pageProps} />
        </>
    );
};

export default App;
