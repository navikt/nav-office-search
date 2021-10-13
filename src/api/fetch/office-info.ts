import { getAuthorizationHeader } from './auth';
import {
    FetchErrorResponse,
    fetchErrorResponse,
    fetchJson,
} from './fetch-json';
import { urls } from '../../urls';
import { getOfficeUrl } from '../data/officeUrls';
import { OfficeInfo } from '../../types/data';

type OfficeInfoResponse = {
    error: undefined;
    navn: string;
    enhetNr: string;
};

export const fetchOfficeInfoByGeoId = async (
    id: string
): Promise<OfficeInfo | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    const response = await fetchJson<OfficeInfoResponse>(
        urls.officeInfoApi,
        { id },
        {
            headers: { Authorization: authorizationHeader },
        }
    );

    if (response.error) {
        return response;
    }

    const officeUrl = getOfficeUrl(response.enhetNr);

    if (!officeUrl) {
        return fetchErrorResponse(500, 'No url found for this office!');
    }

    return {
        name: response.navn,
        url: officeUrl,
        geoId: id,
        enhetNr: response.enhetNr,
        hitString: '',
    };
};
