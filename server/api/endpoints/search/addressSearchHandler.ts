import { logger } from '@navikt/navno-logger';
import type { ApiResponse } from '#server/api/apiResponse.ts';
import { apiErrorResponse } from '#server/utils/fetch.ts';
import { type AdresseSokResponse, fetchPdlAdresseSok } from '#server/external/adresse.ts';
import type { SearchResultAdresseProps, SearchResultProps } from '#shared/types/results.ts';

const toAddressSearchResult = (adresseQuery: string, response: AdresseSokResponse): SearchResultAdresseProps => {
	return {
		type: 'adresse',
		adresseQuery,
		adresser: response.adresser,
		totalHits: response.totalHits,
	};
};

export const addressSearchHandler = async (query?: string): Promise<ApiResponse<SearchResultProps>> => {
	try {
		if (!query?.trim()) {
			return { status: 400, body: apiErrorResponse('errorMissingQuery') };
		}

		const adresseSokResponse = await fetchPdlAdresseSok(query);

		if ('error' in adresseSokResponse) {
			logger.error('Address search failed', { query, error: adresseSokResponse.message });

			return { status: adresseSokResponse.statusCode, body: apiErrorResponse('errorServerError') };
		}

		return { status: 200, body: toAddressSearchResult(query, adresseSokResponse) };
	} catch (e) {
		logger.error('Address search api error', e);
		return { status: 500, body: apiErrorResponse('errorServerError') };
	}
};
