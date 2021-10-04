import { fetchJson } from './fetch-json';
import { encodeBase64 } from '../../utils/normalizeString';
import { urls } from '../../urls';
import { objectToQueryString } from '../utils';
import Cache from 'node-cache';

const cacheKey = 'authHeader';

const cache = new Cache({
    deleteOnExpire: true,
});

type TokenResponse = {
    token_type: 'Bearer';
    expires_in: number;
    access_token: string;
};

const fetchAccessToken = async (): Promise<TokenResponse | null> => {
    const response = await fetchJson(urls.azureAdTokenApi, undefined, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: objectToQueryString(
            {
                grant_type: 'client_credentials',
                client_id: process.env.AZURE_APP_CLIENT_ID,
                client_secret: process.env.AZURE_APP_CLIENT_SECRET,
                scope: `api://${process.env.API_CLIENT_ID}/.default`,
            },
            ''
        ),
    });

    if (!response.access_token) {
        console.error('Bad response from token service', response);
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
