import { DecoratorParams } from '@navikt/nav-dekoratoren-moduler';
import { AppLocale } from './localization/types';

export const getDecoratorParams = (locale: AppLocale): DecoratorParams => ({
    context: 'privatperson',
    language: locale,
    availableLanguages: [
        { locale: 'nb', handleInApp: true },
        { locale: 'nn', handleInApp: true },
        { locale: 'en', handleInApp: true },
    ],
});
