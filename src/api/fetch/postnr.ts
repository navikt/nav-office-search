import {
    fetchErrorResponse,
    FetchErrorResponse,
    fetchJson,
} from './fetch-json';
import { getAuthorizationHeader } from './auth';
import { urls } from '../../urls';
import { getKommune } from '../data/kommuner';
import { getBydel } from '../data/bydeler';
import { removeDuplicates } from '../../utils/removeDuplicates';
import { OfficeInfo } from '../../types/data';

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
    hits: AdresseSokHit[];
};

export const officeInfoFromAdresseSokResponse = (
    adresseSokResponse: AdresseSokResponse
): OfficeInfo[] => {
    const officeInfo = adresseSokResponse.hits.reduce((acc, hit) => {
        const geoId = hit.geografiskTilknytning;
        const officeInfo = (getKommune(geoId) || getBydel(geoId))?.officeInfo;

        if (!officeInfo) {
            console.error(`No office info found for geoid ${geoId}`);
            return acc;
        }

        return [...acc, { ...officeInfo, hitString: hit.adressenavn }];
    }, [] as OfficeInfo[]);

    return removeDuplicates(officeInfo, (a, b) => a.enhetNr === b.enhetNr);
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
        { postnr, ...(adresse ? { adresse } : { husnr: '0001' }) },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
