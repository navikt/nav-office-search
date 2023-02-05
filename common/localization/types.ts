import { localeModuleNb } from './modules/nb-default';

export const defaultLocale: AppLocale = 'nb';

export type LocaleModule = typeof localeModuleNb;

export type AppLocale = 'nb' | 'en';

export type LocaleStringId =
    | 'pageTitle'
    | 'ingressLine1'
    | 'ingressLine2'
    | 'inputLabel'
    | 'inputSubmit'
    | 'errorMissingQuery'
    | 'errorInvalidQuery'
    | 'errorInvalidPostnr'
    | 'errorServerError'
    | 'errorInvalidResult'
    | 'errorInputValidationLength'
    | 'errorInputValidationPostnr'
    | 'errorInputValidationName'
    | 'nameResultHeader'
    | 'postnrResultNone'
    | 'postnrResultOne'
    | 'postnrResultMany'
    | 'postnrResultPostbox'
    | 'postnrResultServiceBox'
    | 'postnrResultBydeler'
    | 'nameResultNone'
    | 'nameResultFound'
    | 'breadcrumb1'
    | 'breadcrumb2';
