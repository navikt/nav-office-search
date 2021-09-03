import { getAuthorizationHeader } from './auth';
import {
    FetchErrorResponse,
    fetchErrorResponse,
    fetchJson,
} from './fetch-json';
import { OfficeHitProps } from '../../types/searchResult';
import { urls } from '../../urls';

export const fetchOfficeInfoByGeoId = async (
    id: string
): Promise<OfficeHitProps | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson<OfficeHitProps>(
        urls.officeInfoApi,
        { id },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
