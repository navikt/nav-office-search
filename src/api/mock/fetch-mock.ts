import fetchMockLib from 'fetch-mock';
import { AdresseSokResponse } from '../fetch/postnr';
import { urls } from '../../urls';
import { OfficeInfo } from '../../types/searchResult';
import { fetchErrorResponse, FetchErrorResponse } from '../fetch/fetch-json';
import data from './mock-data.json';
import { KommuneData } from '../data/data';
import { getOfficeUrl } from '../data/officeUrls';

fetchMockLib.config.fallbackToNetwork = true;

export const fetchMock = fetchMockLib
    .sandbox()
    .mock(urls.azureAdTokenApi, {
        token_type: 'Bearer',
        expires_in: 3600,
        access_token: 'dummy-token',
    })
    .mock(
        `begin:${urls.postnrApi}`,
        async (url): Promise<AdresseSokResponse> => {
            const postnr = new URL(url).searchParams.get('postnr');
            if (!postnr) {
                return {
                    hits: [],
                };
            }

            const postnrData = data.postnr.find(
                (item) => item.postnr === postnr
            );
            if (!postnrData) {
                return {
                    hits: [],
                };
            }

            const numOfficesToReturn = (Number(postnr[0]) % 3) + 1;

            return {
                hits: Array.from({ length: numOfficesToReturn }).map(
                    (_, i) => ({
                        kontorNavn: `NAV ${postnrData.kommune} Mock ${i + 1}`,
                        enhetNr: i.toString(),
                        status: 'Aktiv',
                        hitString: `Eksempelgata`,
                        url: getOfficeUrl(postnrData.kommunenr),
                    })
                ),
            };
        }
    )
    .mock(
        `begin:${urls.officeInfoApi}`,
        async (url): Promise<OfficeInfo | FetchErrorResponse> => {
            const id = new URL(url).searchParams.get('id');
            if (!id) {
                return fetchErrorResponse(500, 'Missing id-parameter');
            }

            // @ts-ignore
            const postnrData: KommuneData =
                data.kommuner.find((item) => item.kommunenr === id) ||
                data.bydeler.find((item) => item.bydelsnr === id);

            if (postnrData.officeInfo) {
                return { ...postnrData.officeInfo, hitString: 'test' };
            }

            return fetchErrorResponse(500, 'Mock error');
        }
    );
