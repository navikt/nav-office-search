import fetchMockLib from 'fetch-mock';
import { AdresseSokResponse } from '../fetch/postnr';
import { urls } from '../../urls';
import { OfficeInfo } from '../../types/searchResult';
import { fetchErrorResponse, FetchErrorResponse } from '../fetch/fetch-json';
import jsonData from './mock-data.json';
import { BydelerData, KommuneData, PostnrData } from '../data/data';
import { getOfficeUrl } from '../data/officeUrls';

// @ts-ignore
const mockData: {
    kommuner: KommuneData[];
    postnr: PostnrData[];
    bydeler: BydelerData[];
} = jsonData;

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

            const postnrData = mockData.postnr.find(
                (item) => item.postnr === postnr
            );

            const hits = postnrData?.officeInfo.map((item) => ({
                geografiskTilknytning: item.geoId,
                kommunenummer: postnrData.kommunenr,
                adressenavn: postnrData.poststed,
                postnummer: postnrData.postnr,
            }));

            return {
                hits: hits || [],
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

            const data =
                mockData.kommuner.find((item) => item.kommunenr === id) ||
                mockData.bydeler.find((item) => item.bydelsnr === id);

            if (data?.officeInfo) {
                return {
                    ...data.officeInfo,
                    hitString: 'test',
                    url: getOfficeUrl(data.officeInfo.enhetNr),
                };
            }

            return fetchErrorResponse(500, 'Mock error');
        }
    );
