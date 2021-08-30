import fetchMock from 'fetch-mock';
import { getPostnrRegister } from '../../data/postnrRegister';
import { PostnrApiResponse } from './search-postnr';

const azureAdTokenApi = `https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/oauth2/v2.0/token`;
const postnrApi = `${process.env.API_ORIGIN}/postnr/`;

export const mockFetch = fetchMock
    .sandbox()
    .mock(azureAdTokenApi, {
        token_type: 'Bearer',
        expires_in: 3600,
        access_token: 'dummy-token',
    })
    .mock(`begin:${postnrApi}`, async (url): Promise<PostnrApiResponse> => {
        const postnr = url.split(postnrApi)[1];
        const postnrData = (await getPostnrRegister()).find(
            (item) => item.postnr === postnr
        );

        if (!postnrData) {
            return {
                hits: [],
            };
        }

        return {
            hits: [
                {
                    kontorNavn: 'Mock-kontor',
                    enhetNr: '1337',
                    status: 'Aktiv',
                    hitString: postnrData.poststed,
                },
            ],
        };
    });
