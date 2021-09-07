import fetchMockLib from 'fetch-mock';
import { AdresseSokResponse } from './postnr';
import { urls } from '../../urls';
import { OfficeInfo } from '../../types/searchResult';
import { fetchErrorResponse, FetchErrorResponse } from './fetch-json';
import { getPostnrData } from '../../data/data';

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

            const postnrData = getPostnrData(postnr);
            if (!postnrData) {
                return {
                    hits: [],
                };
            }

            const numOfficesToReturn = (Number(postnr[0]) % 3) + 1;

            return {
                hits: Array.from({ length: numOfficesToReturn }).map(
                    (_, i) => ({
                        kontorNavn: `NAV ${postnrData.kommuneNavn} Mock ${
                            i + 1
                        }`,
                        enhetNr: i.toString(),
                        status: 'Aktiv',
                        adressenavn: `Eksempelgata`,
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

            const postnrData = getPostnrData(id);

            return {
                kontorNavn: `NAV ${
                    postnrData?.kommuneNavn || `Mock-kontor ${id}`
                }`,
                enhetNr: id,
                status: 'Aktiv',
                adressenavn: `Eksempelgata`,
            };
        }
    );
