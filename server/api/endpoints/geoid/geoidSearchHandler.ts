import { logger } from '@navikt/navno-logger';
import type { ApiResponse } from '#server/api/apiResponse.ts';
import { PostnrKategori } from '#shared/types/data.ts';
import type { SearchResultProps } from '#shared/types/results.ts';
import { fetchOfficeInfoByGeoId } from '#server/external/officeInfo.ts';
import { apiErrorResponse } from '#server/utils/fetch.ts';

export const geoidSearchHandler = async (id?: string): Promise<ApiResponse<SearchResultProps>> => {
	if (!id?.trim()) {
		return { status: 400, body: apiErrorResponse('errorInvalidQuery') };
	}

	const trimmedId = id.trim();
	const officeInfo = await fetchOfficeInfoByGeoId(trimmedId);

	if (officeInfo.error) {
		logger.error('Fetching office info for geoid failed', { geoId: trimmedId, error: officeInfo.message });
		return { status: officeInfo.statusCode, body: apiErrorResponse('errorServerError') };
	}

	return {
		status: 200,
		body: {
			type: 'postnr',
			postnr: '',
			poststed: officeInfo.name,
			poststedNormalized: '',
			kommuneNavn: '',
			kommunenr: trimmedId,
			kategori: PostnrKategori.Gateadresser,
			officeInfo: [officeInfo],
		},
	};
};
