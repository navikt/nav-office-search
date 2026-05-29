import { getAuthorizationHeader } from './auth';
import { getKommune } from '../data/kommuner';
import { getBydel } from '../data/bydeler';
import { removeDuplicates } from '../utils/removeDuplicates';
import { OfficeInfo } from '../../../common/types/data';
import { Adresse } from '../../../common/types/results';
import {
    fetchErrorResponse,
    FetchErrorResponse,
    fetchJson,
} from '../utils/fetch';
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

const removeLeadingZeros = (str: string) => str.replace(/^0+/, '');

export const officeInfoFromAdresseSokResponse = (
    adresseSokResponse: AdresseSokResponse
): OfficeInfo[] => {
    const officeInfo = (adresseSokResponse.hits ?? []).reduce((acc, hit) => {
        const geoId = hit.geografiskTilknytning;
        const officeInfo = (getKommune(geoId) || getBydel(geoId))?.officeInfo;

        if (!officeInfo) {
            console.error(`No office info found for geoid ${geoId}`);
            return acc;
        }

        return [
            ...acc,
            {
                ...officeInfo,
                hitString: `${hit.adressenavn} ${removeLeadingZeros(
                    hit.husnummerFra
                )}-${removeLeadingZeros(hit.husnummerTil)}`,
            },
        ];
    }, [] as OfficeInfo[]);

    return removeDuplicates(officeInfo, (a, b) => a.enhetNr === b.enhetNr);
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
