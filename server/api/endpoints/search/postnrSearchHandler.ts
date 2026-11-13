import { logger } from '@navikt/navno-logger';
import { apiErrorResponse, type ApiResponse } from '#server/api/apiResponse.ts';
import { getPoststed } from '#server/data/poststeder.ts';
import { fetchPdlBydelsok } from '#server/external/bydel.ts';
import { fetchOfficeInfoByGeoId } from '#server/external/officeInfo.ts';
import { removeDuplicates } from '#server/utils/removeDuplicates.ts';
import { sortOfficeNames } from '#server/utils/sort.ts';
import { failureOf } from '#server/utils/upstream.ts';
import type { OfficeInfo, Poststed } from '#shared/types/data.ts';
import type { SearchResultPostnrProps, SearchResultProps } from '#shared/types/results.ts';

const findBydelOffice = async (bydelsnr: string) => {
	try {
		return await fetchOfficeInfoByGeoId(bydelsnr);
	} catch (e) {
		logger.error('Looking up the office for a bydel failed', { bydelsnr }, failureOf(e));
		return null;
	}
};

const responseDataWithBydeler = async (poststedData: Poststed): Promise<SearchResultPostnrProps> => {
	let bydelsnumre: string[];
	try {
		({ bydeler: bydelsnumre } = await fetchPdlBydelsok(poststedData.postnr));
	} catch (e) {
		logger.error('Bydel search failed', { postnr: poststedData.postnr }, failureOf(e));
		return { ...poststedData, type: 'postnr' };
	}

	if (bydelsnumre.length === 0) {
		return { ...poststedData, type: 'postnr' };
	}

	const officeResults = await Promise.all(bydelsnumre.map(findBydelOffice));

	const offices = officeResults.filter((office): office is OfficeInfo => office !== null);

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
