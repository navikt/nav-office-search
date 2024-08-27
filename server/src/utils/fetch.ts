import { fetchMock } from '../_mock/fetchMock';
import { LocaleStringId } from '../../../common/localization/types';
import { SearchResultErrorProps } from '../../../common/types/results';

type JsonArray = JsonObject[];

type JsonObject = {
    [key: string]: string | number | boolean | JsonObject | JsonArray;
};

const fetchOrMock = process.env.ENV === 'localhost' ? fetchMock : fetch;

export const apiErrorResponse = (
    messageId: LocaleStringId
): SearchResultErrorProps => ({
    type: 'error',
    messageId,
});

export const objectToQueryString = (params?: object, firstChar = '?') =>
    params
        ? Object.entries(params).reduce(
              (acc, [k, v], i) =>
                  v !== undefined
                      ? `${acc}${i ? '&' : firstChar}${k}=${encodeURIComponent(
                            typeof v === 'object' ? JSON.stringify(v) : v
                        )}`
                      : acc,
              ''
          )
        : '';

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

export const fetchJson = async <T = JsonObject>(
    url: string,
    params?: Record<string, string>,
    options?: RequestInit
): Promise<T | FetchErrorResponse> => {
    const urlWithQuery = `${url}${params ? objectToQueryString(params) : ''}`;

    try {
        const res = await fetchOrMock(urlWithQuery, {
            ...options,
            headers: {
                accept: 'application/json',
                ...(options?.headers && { ...options.headers }),
            },
        });

        const isJson = res.headers
            ?.get('content-type')
            ?.includes?.('application/json');

        if (res.ok && isJson) {
            return (await res.json()) as T;
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
    } catch (e: unknown) {
        const typedError = e as Error;
        console.error(
            `Error fetching from url ${url}: ${typedError?.toString()}`
        );
        return fetchErrorResponse(500, typedError?.toString());
    }
};
