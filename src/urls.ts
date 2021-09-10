export const urls = {
    azureAdTokenApi: `https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/oauth2/v2.0/token`,
    postnrApi: `${process.env.API_ORIGIN}/postnr`,
    officeInfoApi: `${process.env.API_ORIGIN}/geoid`,
    postnrRegister: 'https://www.bring.no/postnummerregister-ansi.txt',
    searchApi: `${process.env.APP_ORIGIN}${process.env.APP_BASEPATH}/api/search`,
    kontaktOss: `${process.env.XP_ORIGIN}/person/kontakt-oss`,
    xpOfficeInfoPath: '/_/service/no.nav.navno/officeInfo',
};
