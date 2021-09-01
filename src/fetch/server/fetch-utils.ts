import nodeFetch from 'node-fetch';
import { mockFetch } from './mocks';
import { objectToQueryString } from '../../utils/fetch';

const fetch = process.env.ENV === 'localhost' ? mockFetch : nodeFetch;

export type ErrorResponse = {
    error: true;
    statusCode: number;
    message: string;
};

export const errorResponse = (
    code: number,
    message: string
): ErrorResponse => ({
    error: true,
    statusCode: code,
    message: `Error code ${code} - ${message}`,
});

export const fetchJson = async <T = any>(
    url: string,
    params?: object,
    options?: object
): Promise<T | ErrorResponse> => {
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
            return errorResponse(
                500,
                `Did not receive a JSON-response from ${urlWithQuery}`
            );
        }

        const errorJson = await res.json();

        console.error('Error fetching json:', errorJson);

        const errorMsg =
            errorJson.message || errorJson.error_description || res.statusText;

        return errorResponse(res.status, errorMsg);
    } catch (e) {
        return errorResponse(500, e.toString());
    }
};
