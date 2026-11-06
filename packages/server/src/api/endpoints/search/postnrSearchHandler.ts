import type { ApiResponse } from '../../apiResponse';
import type { OfficeInfo, Poststed } from '../../../../../common/types/data';
import type { SearchResultPostnrProps, SearchResultProps } from '../../../../../common/types/results';
import { removeDuplicates } from '../../../utils/removeDuplicates';
import { sortOfficeNames } from '../../../utils/sort';
import { getPoststed } from '../../../data/poststeder';
import { apiErrorResponse } from '../../../utils/fetch';
import { fetchPdlBydelsok } from '../../../external/bydel';
import { fetchOfficeInfoByGeoId } from '../../../external/officeInfo';

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
