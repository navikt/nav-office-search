import type { ApiResponse } from '#server/api/apiResponse.ts';
import type { OfficeInfo, Poststed } from '#shared/types/data.ts';
import type { SearchResultPostnrProps, SearchResultProps } from '#shared/types/results.ts';
import { removeDuplicates } from '#server/utils/removeDuplicates.ts';
import { sortOfficeNames } from '#server/utils/sort.ts';
import { getPoststed } from '#server/data/poststeder.ts';
import { apiErrorResponse } from '#server/utils/fetch.ts';
import { fetchPdlBydelsok } from '#server/external/bydel.ts';
import { fetchOfficeInfoByGeoId } from '#server/external/officeInfo.ts';

const responseDataWithBydeler = async (poststedData: Poststed): Promise<SearchResultPostnrProps> => {
	const bydelResponse = await fetchPdlBydelsok(poststedData.postnr);

	if ('error' in bydelResponse) {
		console.error(`Bydel search failed for postnr ${poststedData.postnr}: ${bydelResponse.message}`);
		return { ...poststedData, type: 'postnr' };
	}

	const bydelsnumre = bydelResponse.bydeler;

	if (bydelsnumre.length === 0) {
		return { ...poststedData, type: 'postnr' };
	}

	const officeResults = await Promise.all(bydelsnumre.map((bydelsnr) => fetchOfficeInfoByGeoId(bydelsnr)));

	const offices: OfficeInfo[] = officeResults.filter((result): result is OfficeInfo => !result.error);

	const officeInfo = removeDuplicates(offices, (a, b) => a.enhetNr === b.enhetNr).sort(sortOfficeNames);

	return {
		...poststedData,
		type: 'postnr',
		officeInfo,
	};
};

export const postnrSearchHandler = async (query: string): Promise<ApiResponse<SearchResultProps>> => {
	const postnr = query.trim();

	const poststedData = await getPoststed(postnr);

	if (!poststedData) {
		return { status: 404, body: apiErrorResponse('errorInvalidPostnr') };
	}

	if (poststedData.officeInfo.length > 0) {
		return { status: 200, body: { ...poststedData, type: 'postnr' } };
	}

	return { status: 200, body: await responseDataWithBydeler(poststedData) };
};
