import React from 'react';
import {
    Components,
    fetchDecoratorReact,
} from '@navikt/nav-dekoratoren-moduler/ssr';
import { objectToQueryString } from './utils';
import { getDecoratorParams } from '../../src-common/decoratorParams';
import { AppLocale } from '../../src-common/localization/types';

const decoratorUrl = process.env.DECORATOR_FALLBACK_URL;
const decoratorEnv = process.env.ENV;
const decoratorLocalPort = process.env.DECORATOR_LOCAL_PORT || 8100;
const fetchTimeoutMs = 15000;

const envProps =
    decoratorEnv === 'localhost'
        ? {
              env: decoratorEnv,
              port: decoratorLocalPort,
          }
        : { env: decoratorEnv };

const decoratorComponentsCSR = (locale: AppLocale): Components => {
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
