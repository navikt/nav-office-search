import { DecoratorParams } from '@navikt/nav-dekoratoren-moduler';
import { AppLocale } from './localization/types';
import { localeString } from './localization/localeString';

export const getDecoratorParams = (
    locale: AppLocale,
    kontaktOssUrl: string
): DecoratorParams => ({
    context: 'privatperson',
    language: locale,
    breadcrumbs: [
        {
            url: `${kontaktOssUrl}/${locale}`,
            title: localeString('breadcrumb1', locale) as string,
        },
        {
            url: '/',
            title: localeString('breadcrumb2', locale) as string,
        },
    ],
    availableLanguages: [
        { locale: 'nb', handleInApp: true },
        { locale: 'nn', handleInApp: true },
        { locale: 'en', handleInApp: true },
    ],
});
