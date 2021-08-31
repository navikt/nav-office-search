import { getAuthorizationHeader } from './auth';
import { errorResponse, fetchJson } from './fetch-utils';

const apiUrl = `${process.env.API_ORIGIN}/geoid`;

export const fetchOfficeInfoByGeoIds = async (ids: string[]) => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return errorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson(
        apiUrl,
        { ids },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
