import {
    SearchResultErrorProps,
    SearchResultProps,
} from './types/searchResult';
import { urls } from './urls';

let abortController =
    typeof window !== 'undefined' ? new AbortController() : null;

export const fetchSearchClient = (
    query: string
): Promise<SearchResultProps> => {
    abortController?.abort();
    abortController = new AbortController();

    return fetch(`${urls.searchApi}?query=${query}`, {
        signal: abortController.signal,
    })
        .then((res) => res.json())
        .catch((e): SearchResultErrorProps => {
            if (e.name === 'AbortError') {
                return { type: 'error', aborted: true };
            }
            return { type: 'error', messageId: 'errorServerError' };
        });
};
