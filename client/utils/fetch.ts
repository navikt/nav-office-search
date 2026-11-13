import { corgi, isAbortError, isHttpError } from '@itsy/corgi';
import { abortPrevious } from '@itsy/corgi/abort-previous';
import type { SearchResultErrorProps, SearchResultProps } from '#shared/types/results.ts';
import { isValidPostnrQuery } from '#shared/validateInput.ts';
import { clientUrls } from '#client/urls.ts';

// Used to cancel the previous fetch before a new one starts -> prevent racing
const previous = abortPrevious();
const api = corgi.create({ plugins: [previous] });

export const abortSearchClient = () => previous.abort();

type FetchSearchClientOptions = {
	onAddressSearchStart?: () => void;
};

const isErrorResult = (body: unknown): body is SearchResultErrorProps =>
	typeof body === 'object' && body !== null && 'type' in body && body.type === 'error';

// The API may contain useful error data, like an unknown postnummer.
// Anything else is a server error.
const toErrorResult = (e: unknown): SearchResultErrorProps => {
	if (isAbortError(e)) {
		return { type: 'error', aborted: true };
	}
	if (isHttpError(e) && isErrorResult(e.data)) {
		return e.data;
	}
	return { type: 'error', messageId: 'errorServerError' };
};

const fetchSearchResult = (url: string, query: Record<string, string>) =>
	api.get<SearchResultProps>(url, { query, responseType: 'json' });

export async function fetchSearchClient(
	query: string,
	options: FetchSearchClientOptions = {},
): Promise<SearchResultProps> {
	const searchPromise = isValidPostnrQuery(query)
		? fetchSearchResult(clientUrls.searchApi, { query })
		: fetchSearchResult(clientUrls.searchNameApi, { query }).then((result) => {
				if (result.type !== 'name' || result.hits.length > 0) {
					return result;
				}

				options.onAddressSearchStart?.();
				return fetchSearchResult(clientUrls.searchAddressApi, { query });
			});

	return searchPromise.catch(toErrorResult);
}

export const fetchGeoidClient = (id: string): Promise<SearchResultProps> =>
	fetchSearchResult(clientUrls.geoidApi, { id }).catch(toErrorResult);
