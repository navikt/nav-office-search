import { SearchHitProps } from '../../types/searchResult';
import { errorResponse, ErrorResponse, fetchJson } from './fetch-utils';
import { getAuthorizationHeader } from './auth';

const apiUrl = `${process.env.API_ORIGIN}/postnr`;

export type AdresseSokResponse = {
    error?: undefined;
    hits: SearchHitProps[];
};

export const fetchTpsAdresseSok = async (
    postnr: string,
    adresse?: string
): Promise<AdresseSokResponse | ErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return errorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson(
        apiUrl,
        { postnr, ...(adresse && { adresse }) },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
