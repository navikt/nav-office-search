import { getAuthorizationHeader } from './auth';
import { fetchErrorResponse, FetchErrorResponse, fetchJson } from '../utils/fetch';
import { serverUrls } from '../urls';

export type AggregationValue = {
    value: string;
};

export type Aggregation = {
    fieldName: 'vegadresse.kommunenummer' | 'vegadresse.bydelsnummer';
    values: AggregationValue[];
};

export type BydelSokResponse = {
    error?: undefined;
    sokAdresse?: {
        aggregations: Aggregation[];
    };
};

export const fetchPdlBydelsok = async (
    postnummer: string
): Promise<BydelSokResponse | FetchErrorResponse> => {
    const authorizationHeader = await getAuthorizationHeader();

    if (!authorizationHeader) {
        return fetchErrorResponse(500, 'Failed to get authorization header');
    }

    return await fetchJson(
        serverUrls.bydelApi,
        {
            postnummer,
        },
        {
            headers: { Authorization: authorizationHeader },
        }
    );
};
