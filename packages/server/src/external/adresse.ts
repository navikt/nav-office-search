import { getAuthorizationHeader } from './auth';
import { Adresse } from '../../../common/types/results';
import { fetchErrorResponse, FetchErrorResponse, fetchJson } from '../utils/fetch';
import { serverUrls } from '../urls';

export type AdresseSokHit = {
    kommunenummer: string;
    kommunenavn: string;
    adressenavn: string;
    husnummerFra: string;
    husnummerTil: string;
    postnummer: string;
    poststed: string;
    geografiskTilknytning: string;
    gatekode: string;
    bydel?: string;
};

export type AdresseSokResponse = {
    error?: undefined;
    hits?: AdresseSokHit[];
    sokAdresse?: {
        hits: Adresse[];
        totalHits: number;
    };
};

export const fetchPdlAdresseSok = async (
    adresse: string
): Promise<AdresseSokResponse | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson(
        serverUrls.adresseApi,
        {
            queryString: adresse,
        },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
