import type { ApiResponse } from '../../apiResponse';
import { PostnrKategori } from '../../../../../common/types/data';
import type { SearchResultProps } from '../../../../../common/types/results';
import { fetchOfficeInfoByGeoId } from '../../../external/officeInfo';
import { apiErrorResponse } from '../../../utils/fetch';

export const geoidSearchHandler = async (id?: string): Promise<ApiResponse<SearchResultProps>> => {
	if (!id?.trim()) {
		return { status: 400, body: apiErrorResponse('errorInvalidQuery') };
	}

	const trimmedId = id.trim();
	const safeIdForLog = trimmedId.replace(/[\r\n]/g, '');
	const officeInfo = await fetchOfficeInfoByGeoId(trimmedId);

	if (officeInfo.error) {
		console.error(`Error fetching office info for geoid ${safeIdForLog}: ${officeInfo.message}`);
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
