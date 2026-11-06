import type { ApiResponse } from '../../apiResponse';
import { getNameSearchResult } from './nameSearchHandler';
import { apiErrorResponse } from '../../../utils/fetch';
import type { SearchResultProps } from '../../../../../common/types/results';
import { isValidPostnrQuery } from '../../../../../common/validateInput';
import { postnrSearchHandler } from './postnrSearchHandler';
import { addressSearchHandler } from './addressSearchHandler';

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
