import { isTimeoutError } from '@itsy/corgi';
import { logger } from '@navikt/navno-logger';
import { failureOf } from '@navikt/navno-server/upstream';
import { apiErrorResponse, type ApiResponse } from '#server/api/apiResponse.ts';
import { officeSearchApi } from '#server/external/officeSearchApi.ts';
import { serverUrls } from '#server/urls.ts';
import type { SearchResultProps } from '#shared/types/results.ts';

/**
 * The search is nav-office-search-api's: it decides what a query is, and finds the offices. What it answers is passed
 * on as it is, the status and the body. That goes for its errors too, which it answers in the shape the browser
 * reads. Without an answer to pass on, this answers in that shape itself: 504 when the API takes too long, else 502.
 */
export const searchHandler = async (query?: string): Promise<ApiResponse<SearchResultProps>> => {
	try {
		const response = await officeSearchApi.raw(serverUrls.searchApi, { query: query === undefined ? {} : { query } });
		const body = (await response.json()) as SearchResultProps;

		if (response.status >= 500) {
			// The API's own logs say why
			logger.error('Search failed', { status: response.status });
		}

		return { status: response.status, body };
	} catch (e) {
		// Not the query, which can be an address someone typed
		logger.error('Search failed', failureOf(e));
		return { status: isTimeoutError(e) ? 504 : 502, body: apiErrorResponse('errorServerError') };
	}
};
