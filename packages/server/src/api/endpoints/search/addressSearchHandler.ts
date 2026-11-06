import type { ApiResponse } from '../../apiResponse';
import { apiErrorResponse } from '../../../utils/fetch';
import { type AdresseSokResponse, fetchPdlAdresseSok } from '../../../external/adresse';
import type { SearchResultAdresseProps, SearchResultProps } from '../../../../../common/types/results';

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
			console.error(`Address search failed for query ${query.replace(/[\r\n]/g, '')}: ${adresseSokResponse.message}`);

			return { status: adresseSokResponse.statusCode, body: apiErrorResponse('errorServerError') };
		}

		return { status: 200, body: toAddressSearchResult(query, adresseSokResponse) };
	} catch (e) {
		console.error(`Address search api error: ${e}`);
		return { status: 500, body: apiErrorResponse('errorServerError') };
	}
};
