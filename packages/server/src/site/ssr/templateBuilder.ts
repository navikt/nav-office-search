import path from 'path';
import { injectDecoratorServerSide, DecoratorEnvProps } from '@navikt/nav-dekoratoren-moduler/ssr';
import { getDecoratorParams } from '../../../../common/decoratorParams';
import { AppLocale } from '../../../../common/localization/types';
import { serverUrls } from '../../urls';

const decoratorEnv = process.env.ENV || 'prod';
const decoratorLocalUrl = process.env.DECORATOR_LOCAL_URL;

const envProps: DecoratorEnvProps =
    decoratorEnv === 'localhost'
        ? {
              env: decoratorEnv,
              localUrl: decoratorLocalUrl,
          }
        : { env: decoratorEnv };

const templatePath =
    process.env.NODE_ENV === 'development'
        ? path.resolve(process.cwd(), '..', 'client', 'index.html')
        : path.resolve(process.cwd(), 'frontendDist', 'client', 'index.html');

export const getTemplateWithDecorator = async (locale: AppLocale) => {
    const params = getDecoratorParams(locale, serverUrls.kontaktOss);

    const html = await injectDecoratorServerSide({
        ...envProps,
        filePath: templatePath,
        params,
    });

    // The local decorator may inject <link> tags with an explicit closing tag
    // (e.g. <link ...></link>), which is invalid HTML for void elements and
    // causes parse5 (used by Vite's transformIndexHtml) to throw an error.
    return html.replace(/<\/link>/gi, '');
};
