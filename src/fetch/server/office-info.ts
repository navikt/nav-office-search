import { getAuthorizationHeader } from './auth';
import {
    FetchErrorResponse,
    fetchErrorResponse,
    fetchJson,
} from './fetch-utils';
import { SearchHitProps } from '../../types/searchResult';
import { urls } from '../../urls';

export const fetchOfficeInfoByGeoId = async (
    id: string
): Promise<SearchHitProps | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson<SearchHitProps>(
        urls.officeInfoApi,
        { id },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
