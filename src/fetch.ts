import { SearchResultProps } from './types/searchResult';
import { urls } from './urls';

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

export const fetchSearchClient = (query: string): Promise<SearchResultProps> =>
    fetch(
        `${urls.searchApi}${objectToQueryString({
            query,
        })}`
    ).then((res) => res.json());
