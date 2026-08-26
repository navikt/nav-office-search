import { getAuthorizationHeader } from './auth';
import { fetchErrorResponse, FetchErrorResponse, fetchJson } from '../utils/fetch';
import { serverUrls } from '../urls';

export type BydelSokResponse = {
    bydeler: string[];
};

export const fetchPdlBydelsok = async (
    postnummer: string
): Promise<BydelSokResponse | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson(
        serverUrls.bydelApi,
        {
            postnummer,
        },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
