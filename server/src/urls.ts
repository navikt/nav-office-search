export const serverUrls = {
    searchApi: `${process.env.VITE_APP_ORIGIN}${process.env.VITE_APP_BASEPATH}/api/search`,
    kontaktOss: `${process.env.VITE_XP_ORIGIN}/person/kontakt-oss`,
    azureAdTokenApi: `https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/oauth2/v2.0/token`,
    postnrApi: `${process.env.API_ORIGIN}/postnr`,
    officeInfoApi: `${process.env.API_ORIGIN}/geoid`,
    xpOfficeInfoApi: `${process.env.VITE_XP_ORIGIN}/_/service/no.nav.navno/officeInfo`,
    postnrRegister: 'https://www.bring.no/postnummerregister-ansi.txt',
    ssbBydelerClassification:
        'https://data.ssb.no/api/klass/v1/classifications/103',
};
