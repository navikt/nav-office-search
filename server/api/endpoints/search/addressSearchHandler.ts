import { isHttpError } from '@itsy/corgi';
import { logger } from '@navikt/navno-logger';
import { apiErrorResponse, type ApiResponse } from '#server/api/apiResponse.ts';
import { fetchPdlAdresseSok } from '#server/external/adresse.ts';
import { failureOf } from '#server/utils/upstream.ts';
import type { SearchResultProps } from '#shared/types/results.ts';

export const addressSearchHandler = async (query?: string): Promise<ApiResponse<SearchResultProps>> => {
	if (!query?.trim()) {
		return { status: 400, body: apiErrorResponse('errorMissingQuery') };
	}

	try {
		const { adresser, totalHits } = await fetchPdlAdresseSok(query);

		return { status: 200, body: { type: 'adresse', adresseQuery: query, adresser, totalHits } };
	} catch (e) {
		// Not the query, which is an address someone typed
		logger.error('Address search failed', failureOf(e));
		return { status: isHttpError(e) ? e.status : 500, body: apiErrorResponse('errorServerError') };
	}
};
