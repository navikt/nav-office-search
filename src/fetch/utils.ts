import fetch from 'node-fetch';

export type ErrorResponse = {
    error: true;
    statusCode: number;
    message: string;
};

const errorResponse = (
    code: number,
    message: string,
    url: string
): ErrorResponse => ({
    error: true,
    statusCode: code,
    message: `Error ${code} fetching JSON from ${url} - ${message}`,
});

export const objectToQueryString = (params?: object) =>
    params
        ? Object.entries(params).reduce(
              (acc, [k, v], i) =>
                  v !== undefined
                      ? `${acc}${i ? '&' : '?'}${k}=${encodeURIComponent(
                            typeof v === 'object' ? JSON.stringify(v) : v
                        )}`
                      : acc,
              ''
          )
        : '';

export const fetchJson = async (
    apiUrl: string,
    params?: object,
    options?: object
) => {
    const url = `${apiUrl}${params ? objectToQueryString(params) : ''}`;

    try {
        const res = await fetch(url, options);

        const isJson = res.headers
            ?.get('content-type')
            ?.includes?.('application/json');

        if (res.ok && isJson) {
            return res.json();
        }

        if (res.ok) {
            return errorResponse(500, 'Did not receive a JSON-response', url);
        }

        const errorJson = await res.json();

        console.error('Error fetching json:', errorJson);

        const errorMsg =
            errorJson.message || errorJson.error_description || res.statusText;

        return errorResponse(res.status, errorMsg, url);
    } catch (e) {
        return errorResponse(500, e.toString(), url);
    }
};
