import fetchMockLib from 'fetch-mock';
import { AdresseSokResponse } from '../api/fetch/postnr';
import { getOfficeUrl } from '../data/officeUrls';
import { FetchErrorResponse, fetchErrorResponse } from '../utils/fetch';
import {
    Bydel,
    Kommune,
    OfficeInfo,
    Poststed,
} from '../../../common/types/data';
import { serverUrls } from '../urls';

import jsonData from './data/data.json';
import officeUrlData from './data/office-urls.json';

type MockData = {
    kommuner: Kommune[];
    postnr: Poststed[];
    bydeler: Bydel[];
};

const mockData = jsonData as unknown as MockData;

fetchMockLib.config.fallbackToNetwork = true;

export const fetchMock = fetchMockLib
    .sandbox()
    .mock(serverUrls.azureAdTokenApi, {
        token_type: 'Bearer',
        expires_in: 3600,
        access_token: 'dummy-token',
    })
    .mock(
        `begin:${serverUrls.postnrApi}`,
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
        `begin:${serverUrls.officeInfoApi}`,
        async (url): Promise<OfficeInfo | FetchErrorResponse> => {
            const id = new URL(url).searchParams.get('id');
            if (!id) {
                return fetchErrorResponse(500, 'Missing id-parameter');
            }

            const data =
                mockData.kommuner.find((item) => item.kommunenr === id) ||
                mockData.bydeler.find((item) => item.bydelsnr === id);

            if (data?.officeInfo) {
                const url = getOfficeUrl(data.officeInfo.enhetNr);

                if (url) {
                    return {
                        ...data.officeInfo,
                        hitString: 'mock',
                        url,
                    };
                }
            }

            return fetchErrorResponse(500, 'Mock error');
        }
    )
    .mock(serverUrls.xpOfficeInfoApi, async () => {
        return officeUrlData;
    });
