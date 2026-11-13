import { logger } from '@navikt/navno-logger';
import { apiErrorResponse, type ApiResponse } from '#server/api/apiResponse.ts';
import { referenceData } from '#server/data/data.ts';
import type { Offices } from '#server/data/offices.ts';
import { fetchPdlBydelsok } from '#server/external/bydel.ts';
import { removeDuplicates } from '#server/utils/removeDuplicates.ts';
import { sortOfficeNames } from '#server/utils/sort.ts';
import { failureOf } from '#server/utils/upstream.ts';
import type { OfficeInfo, Poststed } from '#shared/types/data.ts';
import type { SearchResultPostnrProps, SearchResultProps } from '#shared/types/results.ts';

const responseDataWithBydeler = async (poststedData: Poststed, offices: Offices): Promise<SearchResultPostnrProps> => {
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

	// A bydel without an office is left out
	const bydelOffices = bydelsnumre
		.map((bydelsnr) => offices.get(bydelsnr))
		.filter((office): office is OfficeInfo => office !== undefined);

	const officeInfo = removeDuplicates(bydelOffices, (a, b) => a.enhetNr === b.enhetNr).sort(sortOfficeNames);

	return {
		...poststedData,
		type: 'postnr',
		officeInfo,
	};
};

export const postnrSearchHandler = async (query: string): Promise<ApiResponse<SearchResultProps>> => {
	const { poststeder, offices } = referenceData();

	const poststedData = poststeder.get(query.trim());

	if (!poststedData) {
		return { status: 404, body: apiErrorResponse('errorInvalidPostnr') };
	}

	if (poststedData.officeInfo.length > 0) {
		return { status: 200, body: { ...poststedData, type: 'postnr' } };
	}

	return { status: 200, body: await responseDataWithBydeler(poststedData, offices) };
};
