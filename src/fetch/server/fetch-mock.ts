import fetchMockLib from 'fetch-mock';
import { getPostnrRegister } from '../../data/postnrRegister';
import { AdresseSokResponse } from './postnr';

const azureAdTokenApi = `https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/oauth2/v2.0/token`;
const postnrApi = `${process.env.API_ORIGIN}/postnr`;

export const fetchMock = fetchMockLib
    .sandbox()
    .mock(azureAdTokenApi, {
        token_type: 'Bearer',
        expires_in: 3600,
        access_token: 'dummy-token',
    })
    .mock(
        `begin:${postnrApi}`,
        async (url): Promise<AdresseSokResponse> => {
            const postnr = new URL(url).searchParams.get('postnr');
            if (!postnr) {
                return {
                    hits: [],
                };
            }

            const postnrData = (await getPostnrRegister()).find(
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
                        kontorNavn: `NAV Mock kontor ${i + 1}`,
                        enhetNr: i.toString(),
                        status: 'Aktiv',
                        hitString: postnrData.poststed,
                    })
                ),
            };
        },
        { delay: 1000 }
    );
