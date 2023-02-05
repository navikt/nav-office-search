import { Params } from '@navikt/nav-dekoratoren-moduler';
import { AppLocale } from './localization/types';
import { localeString } from './localization/localeString';

const defaultParams: Params = {
    context: 'privatperson',
};

export const getDecoratorParams = (
    locale: AppLocale,
    kontaktOssUrl: string
): Params => ({
    ...defaultParams,
    language: locale,
    breadcrumbs: [
        {
            url: `${kontaktOssUrl}/${locale}`,
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
