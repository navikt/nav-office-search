import { getAuthorizationHeader } from './auth';
import { getKommune } from '../data/kommuner';
import { getBydel } from '../data/bydeler';
import { removeDuplicates } from '../utils/removeDuplicates';
import { OfficeInfo } from '../../../common/types/data';
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
    hits: AdresseSokHit[];
};

const removeLeadingZeros = (str: string) => str.replace(/^0+/, '');

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

export const fetchTpsAdresseSok = async (
    postnr: string,
    kommunenr: string,
    gatenavn?: string,
    husnr?: string
): Promise<AdresseSokResponse | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson(
        serverUrls.postnrApi,
        {
            postnr,
            kommunenr,
            ...(gatenavn
                ? { adresse: gatenavn, ...(husnr && { husnr }) }
                : { husnr: '0001' }),
        },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
