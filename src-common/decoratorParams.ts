import { Params } from '@navikt/nav-dekoratoren-moduler';
import { urls } from './urls';
import { AppLocale } from './localization/types';
import { localeString } from './localization/localeString';

const defaultParams: Params = {
    context: 'privatperson',
};

export const getDecoratorParams = (locale: AppLocale): Params => ({
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
        { locale: 'nb', handleInApp: true },
        { locale: 'en', handleInApp: true },
    ],
});
