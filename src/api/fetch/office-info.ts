import { getAuthorizationHeader } from './auth';
import {
    FetchErrorResponse,
    fetchErrorResponse,
    fetchJson,
} from './fetch-json';
import { OfficeInfo } from '../../types/searchResult';
import { urls } from '../../urls';
import { getOfficeUrl } from '../data/officeUrls';

export const fetchOfficeInfoByGeoId = async (
    id: string
): Promise<OfficeInfo | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    const result = await fetchJson<OfficeInfo>(
        urls.officeInfoApi,
        { id },
        {
            headers: { Authorization: authorizationHeader },
        }
    );

    if (result.error) {
        return result;
    }

    return { ...result, url: getOfficeUrl(result.enhetNr), geoId: id };
};
