import type { ApiResponse } from '#server/api/apiResponse.ts';
import { getNameSearchResult } from './nameSearchHandler.ts';
import { apiErrorResponse } from '#server/utils/fetch.ts';
import type { SearchResultProps } from '#shared/types/results.ts';
import { isValidPostnrQuery } from '#shared/validateInput.ts';
import { postnrSearchHandler } from './postnrSearchHandler.ts';
import { addressSearchHandler } from './addressSearchHandler.ts';

export const searchHandler = async (query?: string): Promise<ApiResponse<SearchResultProps>> => {
	console.log('Received search request');

	try {
		if (!query?.trim()) {
			return { status: 400, body: apiErrorResponse('errorMissingQuery') };
		}

		if (isValidPostnrQuery(query)) {
			return postnrSearchHandler(query);
		}

		const nameResult = getNameSearchResult(query);
		if (nameResult.hits.length > 0) {
			return { status: 200, body: nameResult };
		}

		return addressSearchHandler(query);
	} catch (e) {
		console.error(`Search api error: ${e}`);
		return { status: 500, body: apiErrorResponse('errorServerError') };
	}
};
