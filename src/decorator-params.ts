import { Params } from '@navikt/nav-dekoratoren-moduler';
import { Locale, localeString } from './localization/LocaleString';

const defaultParams: Params = {
    context: 'privatperson',
};

export const getDecoratorParams = (locale: Locale): Params => ({
    ...defaultParams,
    language: locale,
    breadcrumbs: [
        {
            url: `${process.env.XP_ORIGIN}/person/kontakt-oss/${locale}`,
            title: localeString('breadcrumb1', locale),
        },
        {
            url: `${process.env.APP_BASEPATH}/${locale}`,
            title: localeString('breadcrumb2', locale),
        },
    ],
    availableLanguages: [
        { locale: 'nb', url: '/', handleInApp: true },
        { locale: 'en', url: '/', handleInApp: true },
    ],
});
