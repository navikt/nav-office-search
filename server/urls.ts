import { joinURL } from 'ufo';
import { env } from './env.ts';

export const serverUrls = {
	azureAdTokenApi: env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT,
	adresseApi: joinURL(env.API_ORIGIN, 'adresse'),
	bydelApi: joinURL(env.API_ORIGIN, 'bydel'),
	officesApi: joinURL(env.API_ORIGIN, 'geoids'),
	xpOfficeInfoApi: joinURL(env.XP_ORIGIN, '_/service/no.nav.navno/officeInfo'),
	notFoundPage: joinURL(env.NAVNO_ORIGIN, '404'),
	postnrRegister: 'https://www.bring.no/postnummerregister-ansi.txt',
	ssbBydelerClassification: 'https://data.ssb.no/api/klass/v1/classifications/103',
	loginSessionApi: env.LOGIN_SESSION_API_URL,
};
