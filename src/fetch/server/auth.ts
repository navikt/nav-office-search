import { fetchJson } from './fetch-utils';
import { encodeBase64 } from '../../utils';
import { objectToQueryString } from '../../utils/fetch';
import { urls } from '../../urls';

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
    const accessToken = await fetchAccessToken();
    if (!accessToken) {
        return null;
    }

    const tokenBase64 = encodeBase64(accessToken.access_token);

    return `Bearer ${tokenBase64}`;
};
