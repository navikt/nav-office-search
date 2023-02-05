import {
    SearchResultErrorProps,
    SearchResultProps,
} from '../../src-common/types/results';
import { urls } from '../../src-common/urls';

let abortController =
    typeof window !== 'undefined' ? new AbortController() : null;

export const abortSearchClient = () => abortController?.abort();

export const fetchSearchClient = (
    query: string
): Promise<SearchResultProps> => {
    abortSearchClient();
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
