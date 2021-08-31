import { getAuthorizationHeader } from './auth';
import { errorResponse, fetchJson } from './fetch-utils';

const apiUrl = `${process.env.API_ORIGIN}/geoid`;

export const fetchOfficeInfoByGeoId = async (id: string) => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return errorResponse(500, 'Failed to get authorization header');
    }

    const response = await fetchJson(`${apiUrl}/${id}`, undefined, {
        headers: { Authorization: authorizationHeader },
    });

    if (response.error) {
        return null;
    }

    return response;
};
