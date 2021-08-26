import { NextApiRequest, NextApiResponse } from 'next';
import { fetchJson } from '../../fetch/utils';

const tenantId = process.env.AZURE_APP_TENANT_ID;
const backendClientId = '3399e573-0d83-4581-8db9-7b66c8f5f775';

const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

const fetchToken = async () => {
    const response = await fetchJson(
        tokenUrl,
        {
            grant_type: 'client_credentials',
            client_id: process.env.AZURE_APP_CLIENT_ID,
            client_secret: process.env.AZURE_APP_CLIENT_SECRET,
            scope: `api://${backendClientId}/.default`,
        },
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    if (response.ok) {
        return await response.json();
    }

    console.error('Bad response from token service', response);

    throw new Error('Failed to fetch token!');
};

const authTest = async (req: NextApiRequest, res: NextApiResponse) => {
    const tokenData = await fetchToken();

    return res.status(200).json(tokenData);
};

export default authTest;
