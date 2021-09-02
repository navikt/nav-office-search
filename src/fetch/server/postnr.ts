import { SearchHitProps } from '../../types/searchResult';
import {
    fetchErrorResponse,
    FetchErrorResponse,
    fetchJson,
} from './fetch-utils';
import { getAuthorizationHeader } from './auth';
import { urls } from '../../urls';

export type AdresseSokResponse = {
    error?: undefined;
    hits: SearchHitProps[];
};

export const fetchTpsAdresseSok = async (
    postnr: string,
    adresse?: string
): Promise<AdresseSokResponse | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson(
        urls.postnrApi,
        { postnr, ...(adresse && { adresse }) },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
