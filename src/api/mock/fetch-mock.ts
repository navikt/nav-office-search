import fetchMockLib from 'fetch-mock';
import { AdresseSokResponse } from '../fetch/postnr';
import { urls } from '../../urls';
import { fetchErrorResponse, FetchErrorResponse } from '../fetch/fetch-json';
import { getOfficeInfo } from '../data/officeInfo';
import { Bydel, Kommune, OfficeInfo, Poststed } from '../../types/data';

import jsonData from './data/data.json';
import officeUrlData from './data/office-urls.json';

// @ts-ignore
const mockData: {
    kommuner: Kommune[];
    postnr: Poststed[];
    bydeler: Bydel[];
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
                kommunenummer: postnrData.kommunenr,
                kommunenavn: postnrData.kommuneNavn,
                adressenavn: postnrData.poststed,
                husnummerFra: '0000',
                husnummerTil: '0100',
                postnummer: postnrData.postnr,
                poststed: postnrData.poststed,
                geografiskTilknytning: item.geoId,
                gatekode: '000001',
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
                    url: getOfficeInfo(data.officeInfo.enhetNr),
                };
            }

            return fetchErrorResponse(500, 'Mock error');
        }
    )
    .mock(urls.xpOfficeInfoApi, async () => {
        return officeUrlData;
    });
