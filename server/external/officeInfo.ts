import { getAuthorizationHeader } from './auth.ts';
import { getOfficeUrl } from '#server/data/officeUrls.ts';
import { fetchErrorResponse, type FetchErrorResponse, fetchJson } from '#server/utils/fetch.ts';
import type { OfficeInfo } from '#shared/types/data.ts';
import { serverUrls } from '#server/urls.ts';

type OfficeInfoResponse = {
	error: undefined;
	navn: string;
	enhetNr: string;
};

export const fetchOfficeInfoByGeoId = async (id: string): Promise<OfficeInfo | FetchErrorResponse> => {
	const authorizationHeader = await getAuthorizationHeader();

	if (!authorizationHeader) {
		return fetchErrorResponse(500, 'Failed to get authorization header');
	}

	const response = await fetchJson<OfficeInfoResponse>(
		serverUrls.officeInfoApi,
		{ id },
		{
			headers: { Authorization: authorizationHeader },
		},
	);

	if (response.error) {
		return response;
	}

	const officeUrl = getOfficeUrl(response.enhetNr);

	if (!officeUrl) {
		return fetchErrorResponse(500, 'No url found for this office!');
	}

	return {
		name: response.navn,
		url: officeUrl,
		geoId: id,
		enhetNr: response.enhetNr,
		hitString: '',
	};
};
