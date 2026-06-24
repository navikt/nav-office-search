import { SearchResultErrorProps, SearchResultProps } from '../../../common/types/results';
import { isValidPostnrQuery } from '../../../common/validateInput';
import { clientUrls } from '../urls';

let abortController = typeof window !== 'undefined' ? new AbortController() : null;

export const abortSearchClient = () => abortController?.abort();

type FetchSearchClientOptions = {
    onAddressSearchStart?: () => void;
};

const fetchSearchResult = async (url: string): Promise<SearchResultProps> => {
    const res = await fetch(url, {
        signal: abortController?.signal,
    });

    const result = (await res.json()) as SearchResultProps;

    if (!res.ok && result.type !== 'error') {
        return { type: 'error', messageId: 'errorServerError' };
    }

    return result;
};

export const fetchSearchClient = (
    query: string,
    options: FetchSearchClientOptions = {}
): Promise<SearchResultProps> => {
    abortSearchClient();
    abortController = new AbortController();
    const encodedQuery = encodeURIComponent(query);

    const searchPromise = isValidPostnrQuery(query)
        ? fetchSearchResult(`${clientUrls.searchApi}?query=${encodedQuery}`)
        : fetchSearchResult(`${clientUrls.searchNameApi}?query=${encodedQuery}`).then((result) => {
              if (result.type !== 'name' || result.hits.length > 0) {
                  return result;
              }

              options.onAddressSearchStart?.();
              return fetchSearchResult(`${clientUrls.searchAddressApi}?query=${encodedQuery}`);
          });

    return searchPromise.catch((e): SearchResultErrorProps => {
        if (e.name === 'AbortError') {
            return { type: 'error', aborted: true };
        }
        return { type: 'error', messageId: 'errorServerError' };
    });
};

export const fetchGeoidClient = (id: string): Promise<SearchResultProps> => {
    abortSearchClient();
    abortController = new AbortController();

    return fetchSearchResult(`${clientUrls.geoidApi}?id=${encodeURIComponent(id)}`).catch((e): SearchResultErrorProps => {
        if (e.name === 'AbortError') {
            return { type: 'error', aborted: true };
        }
        return { type: 'error', messageId: 'errorServerError' };
    });
};
