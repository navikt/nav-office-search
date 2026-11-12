import { logger } from '@navikt/navno-logger';
import { fetchJson, objectToQueryString } from '#server/utils/fetch.ts';
import Cache from 'node-cache';
import { serverUrls } from '#server/urls.ts';
import { env } from '#server/env.ts';

const cacheKey = 'authHeader';

const cache = new Cache({
	deleteOnExpire: true,
});

const encodeBase64 = (str: string) => Buffer.from(str).toString('base64');

type TokenResponse = {
	token_type: 'Bearer';
	expires_in: number;
	access_token: string;
};

const fetchAccessToken = async (): Promise<TokenResponse | null> => {
	logger.info('Refreshing access token');

	const response = await fetchJson(serverUrls.azureAdTokenApi, undefined, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: objectToQueryString(
			{
				grant_type: 'client_credentials',
				client_id: env.AZURE_APP_CLIENT_ID,
				client_secret: env.AZURE_APP_CLIENT_SECRET,
				scope: `api://${env.API_CLIENT_ID}/.default`,
			},
			'',
		),
	});

	if (!response.access_token) {
		logger.error('Bad response from token service', { response });
		return null;
	}

	return response;
};

export const getAuthorizationHeader = async () => {
	if (cache.has(cacheKey)) {
		return cache.get(cacheKey);
	}

	const accessToken = await fetchAccessToken();
	if (!accessToken) {
		return null;
	}

	const b64BearerToken = `Bearer ${encodeBase64(accessToken.access_token)}`;

	cache.set(cacheKey, b64BearerToken, accessToken.expires_in - 60);

	return b64BearerToken;
};
