import {
    fetchErrorResponse,
    FetchErrorResponse,
    fetchJson,
} from './fetch-json';
import { getAuthorizationHeader } from './auth';
import { urls } from '../../urls';

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
    bydel: string;
};

export type AdresseSokResponse = {
    error?: undefined;
    hits: AdresseSokHit[];
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
