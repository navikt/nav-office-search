import React from 'react';
import {
    Components,
    Props,
    fetchDecoratorReact,
} from '@navikt/nav-dekoratoren-moduler/ssr';
import { objectToQueryString } from '../api/utils';
import { getDecoratorParams } from './decoratorParams';
import { Locale } from '../localization/LocaleString';

const decoratorUrl = process.env.DECORATOR_FALLBACK_URL;
const decoratorEnv = process.env.ENV as Props['env'];
const decoratorLocalPort = process.env.DECORATOR_LOCAL_PORT || 8100;
const fetchTimeoutMs = 15000;

const decoratorComponentsCSR = (locale: Locale): Components => {
    const query = objectToQueryString(getDecoratorParams(locale));

    return {
        Header: () => <div id="decorator-header"></div>,
        Styles: () => (
            <link href={`${decoratorUrl}/css/client.css`} rel="stylesheet" />
        ),
        Footer: () => <div id="decorator-footer"></div>,
        Scripts: () => (
            <>
                <div
                    id="decorator-env"
                    data-src={`${decoratorUrl}/env${query || ''}`}
                ></div>
                <script async={true} src={`${decoratorUrl}/client.js`}></script>
            </>
        ),
    };
};

export const getDecoratorComponents = async (
    locale: Locale
): Promise<Components> => {
    try {
        const decoratorComponents = await Promise.race([
            fetchDecoratorReact({
                ...getDecoratorParams(locale),
                env: decoratorEnv,
                port: decoratorLocalPort,
            }),
            new Promise((res, rej) =>
                setTimeout(() => rej('Fetch timeout'), fetchTimeoutMs)
            ),
        ]);

        return decoratorComponents as Components;
    } catch (e) {
        console.error(`Failed to fetch decorator - ${e}`);
        return decoratorComponentsCSR(locale);
    }
};
