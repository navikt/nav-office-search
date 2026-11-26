import { corgi, isAbortError, isHttpError } from '@itsy/corgi';
import { abortPrevious } from '@itsy/corgi/abort-previous';
import type { LocaleStringId } from '#shared/localization/types.ts';
import type { SearchResultErrorProps, SearchResultProps } from '#shared/types/results.ts';
import { clientUrls } from '#client/urls.ts';
import { captureException } from '#client/utils/apm.ts';

/** What a search finds: a postnummer's offices, the offices by a name, or addresses, each with its office */
export type SearchResult = Exclude<SearchResultProps, SearchResultErrorProps>;

/**
 * The API as a search box uses it: one search at a time. A new search cancels the one in flight, and so does
 * cancel(), when the user moves on. A cancelled search rejects with an AbortError (isAbortError); any other failure
 * rejects too, and errorMessageOf() says what to tell the user.
 */
export const createSearchApi = () => {
	const previous = abortPrevious();
	const api = corgi.create({ plugins: [previous] });

	return {
		// A failure that isn't the API's own answer, like no connection or a body the app can't read, is reported to APM
		// on its way to the caller. An error the API answers with on purpose isn't, and neither is a cancelled search.
		search: (query: string) =>
			api.get<SearchResult>(clientUrls.searchApi, { query: { query }, responseType: 'json' }).catch((e: unknown) => {
				if (
					!isAbortError(e) &&
					(!isErrorAnswer(e) || (isHttpError(e) && e.status >= 500) || errorMessageOf(e) === 'errorServerError')
				) {
					const error = new Error(
						isHttpError(e)
							? `Search request failed (HTTP ${e.status})`
							: 'Search request failed without a usable response',
					);
					captureException(error, { fingerprint: 'fetch.search' });
					// APM also captures console.error, so use warn to avoid reporting the same failure twice.
					console.warn(error);
				}
				throw e;
			}),
		cancel: () => previous.abort(),
	};
};

export type SearchApi = ReturnType<typeof createSearchApi>;

const isErrorResult = (body: unknown): body is SearchResultErrorProps =>
	typeof body === 'object' && body !== null && 'type' in body && body.type === 'error';

// An error the API answered with on purpose, in the shape the app reads
const isErrorAnswer = (e: unknown) => isHttpError(e) && isErrorResult(e.data);

/** What to tell the user about a failed search: the API's own message, like an unknown postnummer, or a server error */
export const errorMessageOf = (e: unknown): LocaleStringId =>
	(isHttpError(e) && isErrorResult(e.data) && e.data.messageId) || 'errorServerError';
