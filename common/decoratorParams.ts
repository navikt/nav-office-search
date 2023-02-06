import { Params } from '@navikt/nav-dekoratoren-moduler';
import { AppLocale } from './localization/types';
import { localeString } from './localization/localeString';

export const getDecoratorParams = (
    locale: AppLocale,
    kontaktOssUrl: string
): Params => ({
    context: 'privatperson',
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
