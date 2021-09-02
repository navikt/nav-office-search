import fetchMockLib from 'fetch-mock';
import { getPostnrRegister } from '../../data/postnrRegister';
import { AdresseSokResponse } from './postnr';
import { urls } from '../../urls';
import { SearchHitProps } from '../../types/searchResult';
import { fetchErrorResponse, FetchErrorResponse } from './fetch-utils';

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
                        adressenavn: `Eksempelgata`,
                    })
                ),
            };
        },
        { delay: 1000 }
    )
    .mock(
        `begin:${urls.officeInfoApi}`,
        async (url): Promise<SearchHitProps | FetchErrorResponse> => {
            const id = new URL(url).searchParams.get('id');
            if (!id) {
                return fetchErrorResponse(500, 'Missing id-parameter');
            }

            return {
                kontorNavn: 'NAV Mock kontor',
                enhetNr: '1337',
                status: 'Aktiv',
                adressenavn: `Eksempelgata`,
            };
        },
        { delay: 1000 }
    );
