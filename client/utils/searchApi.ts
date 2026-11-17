import { corgi, isAbortError, isHttpError } from '@itsy/corgi';
import { abortPrevious } from '@itsy/corgi/abort-previous';
import type { LocaleStringId } from '#shared/localization/types.ts';
import type {
	SearchResultAdresseProps,
	SearchResultErrorProps,
	SearchResultNameProps,
	SearchResultPostnrProps,
} from '#shared/types/results.ts';
import { clientUrls } from '#client/urls.ts';
import { captureException } from '#client/utils/apm.ts';

/**
 * The API as a search box uses it: one request at a time. A new request cancels the one in flight, and so does
 * cancel(), when the user moves on. A cancelled request rejects with an AbortError (isAbortError); any other failure
 * rejects too, and errorMessageOf() says what to tell the user.
 */
export const createSearchApi = () => {
	const previous = abortPrevious();
	const api = corgi.create({ plugins: [previous] });

	// A failure that isn't the API's own answer, like no connection or a body the app can't read, is reported to APM
	// on its way to the caller. An error the API answers with on purpose isn't, and neither is a cancelled request.
	const get = <Result>(url: string, query: Record<string, string>, fingerprint: string) =>
		api.get<Result>(url, { query, responseType: 'json' }).catch((e: unknown) => {
			if (!isAbortError(e) && !isErrorAnswer(e)) {
				captureException(e, { fingerprint });
			}
			throw e;
		});

	return {
		postnr: (query: string) => get<SearchResultPostnrProps>(clientUrls.searchApi, { query }, 'fetch.search'),
		name: (query: string) => get<SearchResultNameProps>(clientUrls.searchNameApi, { query }, 'fetch.search'),
		address: (query: string) => get<SearchResultAdresseProps>(clientUrls.searchAddressApi, { query }, 'fetch.search'),
		/** The office of a kommune or bydel, by its number */
		office: (geoId: string) => get<SearchResultPostnrProps>(clientUrls.geoidApi, { id: geoId }, 'fetch.geoid'),
		cancel: () => previous.abort(),
	};
};

export type SearchApi = ReturnType<typeof createSearchApi>;

const isErrorResult = (body: unknown): body is SearchResultErrorProps =>
	typeof body === 'object' && body !== null && 'type' in body && body.type === 'error';

// An error the API answered with on purpose, in the shape the app reads
const isErrorAnswer = (e: unknown) => isHttpError(e) && isErrorResult(e.data);

/** What to tell the user about a failed request: the API's own message, like an unknown postnummer, or a server error */
export const errorMessageOf = (e: unknown): LocaleStringId =>
	(isHttpError(e) && isErrorResult(e.data) && e.data.messageId) || 'errorServerError';
