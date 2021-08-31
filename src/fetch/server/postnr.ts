import { SearchHitProps } from '../../types/searchResult';
import { errorResponse, ErrorResponse, fetchJson } from './fetch-utils';
import { getAuthorizationHeader } from './auth';

const apiUrl = `${process.env.API_ORIGIN}/postnr`;

export type PostnrApiResponse = {
    error?: undefined;
    hits: SearchHitProps[];
};

export const fetchTpsAdresseSok = async (
    postnr: string,
    adresse?: string
): Promise<PostnrApiResponse | ErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return errorResponse(500, 'Failed to get authorization header');
    }

    const routeParams = `${postnr}${adresse ? `/${adresse}` : ''}`;

    return await fetchJson(`${apiUrl}/${routeParams}`, undefined, {
        headers: { Authorization: authorizationHeader },
    });
};
