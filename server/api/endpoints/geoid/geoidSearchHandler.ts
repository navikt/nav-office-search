import { isHttpError } from '@itsy/corgi';
import { logger } from '@navikt/navno-logger';
import { apiErrorResponse, type ApiResponse } from '#server/api/apiResponse.ts';
import { fetchOfficeInfoByGeoId, isGeoId } from '#server/external/officeInfo.ts';
import { failureOf } from '#server/utils/upstream.ts';
import { PostnrKategori } from '#shared/types/data.ts';
import type { SearchResultProps } from '#shared/types/results.ts';

export const geoidSearchHandler = async (id?: string): Promise<ApiResponse<SearchResultProps>> => {
	const geoId = id?.trim();

	// Only a kommunenr or bydelsnr is passed on: anything else is up to whoever calls this public route
	if (!geoId || !isGeoId(geoId)) {
		return { status: 400, body: apiErrorResponse('errorInvalidQuery') };
	}

	try {
		const officeInfo = await fetchOfficeInfoByGeoId(geoId);

		if (!officeInfo) {
			// An area NORG has no office for, like Jan Mayen
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
	} catch (e) {
		logger.error('Looking up the office for a geoid failed', { geoId }, failureOf(e));
		return { status: isHttpError(e) ? e.status : 500, body: apiErrorResponse('errorServerError') };
	}
};
