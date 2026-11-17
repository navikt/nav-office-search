import { joinURL } from 'ufo';
import { env } from './env.ts';

export const serverUrls = {
	azureAdTokenApi: env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT,
	searchApi: joinURL(env.API_ORIGIN, 'search'),
	notFoundPage: joinURL(env.NAVNO_ORIGIN, '404'),
	loginSessionApi: env.LOGIN_SESSION_API_URL,
};
