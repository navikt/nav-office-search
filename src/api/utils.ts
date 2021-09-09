import { OfficeInfo, SearchResultErrorProps } from '../types/searchResult';
import { LocaleStringId } from '../localization/nb-default';
import { AdresseSokResponse } from './fetch/postnr';
import { getBydelerData, getKommuneData } from './data/data';

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
) => {
    return adresseSokResponse.hits.reduce((acc, hit) => {
        const geoId = hit.geografiskTilknytning;
        const officeInfo = (getKommuneData(geoId) || getBydelerData(geoId))
            ?.officeInfo;

        if (!officeInfo) {
            console.error(`No office info found for geoid ${geoId}`);
            return acc;
        }

        return [...acc, officeInfo];
    }, [] as OfficeInfo[]);
};
