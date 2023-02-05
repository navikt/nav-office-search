import path from 'path';
import fs from 'fs';
import {
    injectDecoratorServerSide,
    Params,
} from '@navikt/nav-dekoratoren-moduler/ssr';
import { getDecoratorParams } from '../../../src-common/decoratorParams';
import { AppLocale } from '../../../src-common/localization/types';

const decoratorEnv = process.env.ENV || 'prod';
const decoratorLocalPort = process.env.DECORATOR_LOCAL_PORT || 8100;

const envProps =
    decoratorEnv === 'localhost'
        ? {
              env: decoratorEnv,
              port: decoratorLocalPort,
          }
        : { env: decoratorEnv };

const templatePath =
    process.env.NODE_ENV === 'development'
        ? path.resolve(process.cwd(), '..', 'index.html')
        : path.resolve(process.cwd(), '..', 'dist', 'client', 'index.html');

const getUndecoratedTemplate = () =>
    fs.readFileSync(templatePath, { encoding: 'utf-8' });

const injectWithDecorator = async (
    params: Params,
    retries = 3
): Promise<string> => {
    try {
        return await injectDecoratorServerSide({
            ...params,
            ...envProps,
            filePath: templatePath,
        });
    } catch (e) {
        if (retries > 0) {
            // Use prod-decorator on localhost if the local decorator wasn't responding
            // Probably means the docker-compose network isn't running
            if (decoratorEnv === 'localhost') {
                console.log(
                    'Local decorator did not respond, using prod decorator'
                );
                return injectDecoratorServerSide({
                    ...params,
                    env: 'prod',
                    filePath: templatePath,
                });
            }

            return injectWithDecorator(params, retries - 1);
        }

        console.error(
            `Failed to fetch decorator, returning undecorated template - ${e}`
        );
        return getUndecoratedTemplate();
    }
};

export const getTemplateWithDecorator = async (locale: AppLocale) => {
    const params = getDecoratorParams(locale);

    return injectWithDecorator(params);
};
