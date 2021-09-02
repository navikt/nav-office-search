export const urls = {
    azureAdTokenApi: `https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/oauth2/v2.0/token`,
    postnrApi: `${process.env.API_ORIGIN}/postnr`,
    officeInfoApi: `${process.env.API_ORIGIN}/geoid`,
};
