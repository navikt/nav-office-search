import { logger } from '@navikt/navno-logger';
import { apiErrorResponse, type ApiResponse } from '#server/api/apiResponse.ts';
import { referenceData } from '#server/data/data.ts';
import { isGeoId } from '#server/data/offices.ts';
import { PostnrKategori } from '#shared/types/data.ts';
import type { SearchResultProps } from '#shared/types/results.ts';

export const geoidSearchHandler = async (id?: string): Promise<ApiResponse<SearchResultProps>> => {
	const geoId = id?.trim();

	// Only a kommunenr or bydelsnr: anything else is a mistake by whoever calls this public route
	if (!geoId || !isGeoId(geoId)) {
		return { status: 400, body: apiErrorResponse('errorInvalidQuery') };
	}

	const officeInfo = referenceData().offices.get(geoId);

	if (!officeInfo) {
		// An area without an office: NORG has none for it, like Jan Mayen, or its office has no page on nav.no
		logger.info('No office for geoid', { geoId });
		return { status: 404, body: apiErrorResponse('errorServerError') };
	}

	return {
		status: 200,
		body: {
			type: 'postnr',
			postnr: '',
			poststed: officeInfo.name,
			poststedNormalized: '',
			kommuneNavn: '',
			kommunenr: geoId,
			kategori: PostnrKategori.Gateadresser,
			officeInfo: [officeInfo],
		},
	};
};
