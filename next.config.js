const withTranspileModules = require('next-transpile-modules')([
    '@navikt/nav-dekoratoren-moduler',
    '@navikt/ds-react',
]);

module.exports = withTranspileModules({
    reactStrictMode: true,
    basePath: process.env.APP_BASEPATH,
    env: {
        APP_ORIGIN: process.env.APP_ORIGIN,
        APP_BASEPATH: process.env.APP_BASEPATH,
    },
    i18n: {
        locales: ['nb', 'en'],
        defaultLocale: 'nb',
        localeDetection: false,
    },
});
