import { env } from './env.ts';

export const serverUrls = {
	azureAdTokenApi: env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT,
	adresseApi: `${env.API_ORIGIN}/adresse`,
	bydelApi: `${env.API_ORIGIN}/bydel`,
	officeInfoApi: `${env.API_ORIGIN}/geoid`,
	xpOfficeInfoApi: `${env.XP_ORIGIN}/_/service/no.nav.navno/officeInfo`,
	postnrRegister: 'https://www.bring.no/postnummerregister-ansi.txt',
	ssbBydelerClassification: 'https://data.ssb.no/api/klass/v1/classifications/103',
	loginSessionApi: env.LOGIN_SESSION_API_URL,
};
