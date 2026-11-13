import { corgi, isHttpError } from '@itsy/corgi';
import { abortPrevious } from '@itsy/corgi/abort-previous';
import type { LocaleStringId } from '#shared/localization/types.ts';
import type {
	SearchResultAdresseProps,
	SearchResultErrorProps,
	SearchResultNameProps,
	SearchResultPostnrProps,
} from '#shared/types/results.ts';
import { clientUrls } from '#client/urls.ts';

/**
 * The API as a search box uses it: one request at a time. A new request cancels the one in flight, and so does
 * cancel(), when the user moves on. A cancelled request rejects with an AbortError (isAbortError); any other failure
 * rejects too, and errorMessageOf() says what to tell the user.
 */
export const createSearchApi = () => {
	const previous = abortPrevious();
	const api = corgi.create({ plugins: [previous] });

	const get = <Result>(url: string, query: Record<string, string>) =>
		api.get<Result>(url, { query, responseType: 'json' });

	return {
		postnr: (query: string) => get<SearchResultPostnrProps>(clientUrls.searchApi, { query }),
		name: (query: string) => get<SearchResultNameProps>(clientUrls.searchNameApi, { query }),
		address: (query: string) => get<SearchResultAdresseProps>(clientUrls.searchAddressApi, { query }),
		/** The office of a kommune or bydel, by its number */
		office: (geoId: string) => get<SearchResultPostnrProps>(clientUrls.geoidApi, { id: geoId }),
		cancel: () => previous.abort(),
	};
};

export type SearchApi = ReturnType<typeof createSearchApi>;

const isErrorResult = (body: unknown): body is SearchResultErrorProps =>
	typeof body === 'object' && body !== null && 'type' in body && body.type === 'error';

/** What to tell the user about a failed request: the API's own message, like an unknown postnummer, or a server error */
export const errorMessageOf = (e: unknown): LocaleStringId =>
	(isHttpError(e) && isErrorResult(e.data) && e.data.messageId) || 'errorServerError';
