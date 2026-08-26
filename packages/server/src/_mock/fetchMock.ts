import fetchMockLib from 'fetch-mock';
import { getOfficeUrl } from '../data/officeUrls';
import { fetchErrorResponse } from '../utils/fetch';
import { Bydel, Kommune } from '../../../common/types/data';
import { serverUrls } from '../urls';

import jsonData from './data/data.json';
import officeUrlData from './data/office-urls.json';

type MockData = {
    kommuner: Kommune[];
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
    .mock(`begin:${serverUrls.officeInfoApi}`, async (url: string) => {
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

        return fetch(url);
    })
    .mock(serverUrls.xpOfficeInfoApi, async () => {
        return officeUrlData;
    });

if (serverUrls.loginSessionApi) {
    fetchMock.mock(serverUrls.loginSessionApi, {
        status: 200,
    });
}
