import { OfficeInfo, SearchResultErrorProps } from '../types/searchResult';
import { LocaleStringId } from '../localization/nb-default';
import { AdresseSokResponse } from './fetch/postnr';
import { getBydelerData, getKommuneData } from './data/data';
import { removeDuplicates } from '../utils/removeDuplicates';

export const apiErrorResponse = (
    messageId: LocaleStringId
): SearchResultErrorProps => ({
    type: 'error',
    messageId,
});

export const objectToQueryString = (params?: object, firstChar = '?') =>
    params
        ? Object.entries(params).reduce(
              (acc, [k, v], i) =>
                  v !== undefined
                      ? `${acc}${i ? '&' : firstChar}${k}=${encodeURIComponent(
                            typeof v === 'object' ? JSON.stringify(v) : v
                        )}`
                      : acc,
              ''
          )
        : '';

export const officeInfoFromAdresseSokResponse = (
    adresseSokResponse: AdresseSokResponse
): OfficeInfo[] => {
    const officeInfo = adresseSokResponse.hits.reduce((acc, hit) => {
        const geoId = hit.geografiskTilknytning;
        const officeInfo = (getKommuneData(geoId) || getBydelerData(geoId))
            ?.officeInfo;

        if (!officeInfo) {
            console.error(`No office info found for geoid ${geoId}`);
            return acc;
        }

        return [...acc, officeInfo];
    }, [] as OfficeInfo[]);

    return removeDuplicates(officeInfo, (a, b) => a.enhetNr === b.enhetNr);
};

export const sortOfficeNames = (a: OfficeInfo, b: OfficeInfo) =>
    a.name > b.name ? 1 : -1;
