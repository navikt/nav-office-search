import nodeFetch from 'node-fetch';
import { fetchMock } from './fetch-mock';
import { objectToQueryString } from '../utils';

const fetch = process.env.ENV === 'localhost' ? fetchMock : nodeFetch;

export type FetchErrorResponse = {
    error: true;
    statusCode: number;
    message: string;
};

export const fetchErrorResponse = (
    code: number,
    message: string
): FetchErrorResponse => ({
    error: true,
    statusCode: code,
    message: `Error code ${code} - ${message}`,
});

export const fetchJson = async <T = any>(
    url: string,
    params?: object,
    options?: object
): Promise<T | FetchErrorResponse> => {
    const urlWithQuery = `${url}${params ? objectToQueryString(params) : ''}`;

    try {
        const res = await fetch(urlWithQuery, options);

        const isJson = res.headers
            ?.get('content-type')
            ?.includes?.('application/json');

        if (res.ok && isJson) {
            return res.json();
        }

        if (res.ok) {
            return fetchErrorResponse(
                500,
                `Did not receive a JSON-response from ${urlWithQuery}`
            );
        }

        const errorJson = await res.json();

        console.error('Error fetching json:', errorJson);

        const errorMsg =
            errorJson.message || errorJson.error_description || res.statusText;

        return fetchErrorResponse(res.status, errorMsg);
    } catch (e) {
        return fetchErrorResponse(500, e.toString());
    }
};
