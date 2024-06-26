export const serverUrls = {
    searchApi: `${process.env.VITE_APP_ORIGIN}${process.env.VITE_APP_BASEPATH}/api/search`,
    kontaktOss: `${process.env.VITE_NAVNO_ORIGIN}/person/kontakt-oss`,
    azureAdTokenApi: process.env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT,
    postnrApi: `${process.env.API_ORIGIN}/postnr`,
    officeInfoApi: `${process.env.API_ORIGIN}/geoid`,
    xpOfficeInfoApi: `${process.env.VITE_XP_ORIGIN}/_/service/no.nav.navno/officeInfo`,
    postnrRegister: 'https://www.bring.no/postnummerregister-ansi.txt',
    ssbBydelerClassification:
        'https://data.ssb.no/api/klass/v1/classifications/103',
};
