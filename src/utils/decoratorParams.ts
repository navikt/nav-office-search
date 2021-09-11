import { Params } from '@navikt/nav-dekoratoren-moduler';
import { Locale, localeString } from '../localization/LocaleString';
import { urls } from '../urls';

const defaultParams: Params = {
    context: 'privatperson',
};

export const getDecoratorParams = (locale: Locale): Params => ({
    ...defaultParams,
    language: locale,
    breadcrumbs: [
        {
            url: `${urls.kontaktOss}/${locale}`,
            title: localeString('breadcrumb1', locale),
        },
        {
            url: '/',
            title: localeString('breadcrumb2', locale),
        },
    ],
    availableLanguages: [
        { locale: 'nb', url: '/', handleInApp: true },
        { locale: 'en', url: '/', handleInApp: true },
    ],
});
