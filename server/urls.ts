import { joinURL } from 'ufo';
import { env } from './env.ts';

export const serverUrls = {
	tokenApi: env.NAIS_TOKEN_ENDPOINT,
	searchApi: joinURL(env.API_ORIGIN, 'search'),
	loginSessionApi: env.LOGIN_SESSION_API_URL,
};
