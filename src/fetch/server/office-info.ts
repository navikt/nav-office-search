import { getAuthorizationHeader } from './auth';
import { ErrorResponse, errorResponse, fetchJson } from './fetch-utils';
import { SearchHitProps } from '../../types/searchResult';

const apiUrl = `${process.env.API_ORIGIN}/geoid`;

export const fetchOfficeInfoByGeoId = async (
    id: string
): Promise<SearchHitProps | ErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return errorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson<SearchHitProps>(`${apiUrl}/${id}`, undefined, {
        headers: { Authorization: authorizationHeader },
    });
};
