"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDecoratorParams = void 0;
const localeString_1 = require("./localization/localeString");
const getDecoratorParams = (locale, kontaktOssUrl) => ({
    context: 'privatperson',
    language: locale,
    breadcrumbs: [
        {
            url: `${kontaktOssUrl}/${locale}`,
            title: (0, localeString_1.localeString)('breadcrumb1', locale),
        },
        {
            url: '/',
            title: (0, localeString_1.localeString)('breadcrumb2', locale),
        },
    ],
    availableLanguages: [
        { locale: 'nb', handleInApp: true },
        { locale: 'nn', handleInApp: true },
        { locale: 'en', handleInApp: true },
    ],
});
exports.getDecoratorParams = getDecoratorParams;
