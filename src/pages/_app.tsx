import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { localeString } from '../localization/LocaleString';
import '../global.css';

const App = ({ Component, pageProps }: AppProps) => {
    return (
        <>
            <Head>
                <title>{`${localeString('pageTitle')} - nav.no`}</title>
            </Head>
            <Component {...pageProps} />
        </>
    );
};

export default App;
