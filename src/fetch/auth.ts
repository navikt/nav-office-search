import { fetchJson, objectToQueryString } from './utils';

const tokenUrl = `https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/oauth2/v2.0/token`;

export const fetchToken = async () => {
    const response = await fetchJson(tokenUrl, undefined, {
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
        throw new Error('Failed to fetch token!');
    }

    return response.access_token;
};
