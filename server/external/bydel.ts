import { getAuthorizationHeader } from './auth.ts';
import { fetchErrorResponse, type FetchErrorResponse, fetchJson } from '#server/utils/fetch.ts';
import { serverUrls } from '#server/urls.ts';

export type BydelSokResponse = {
	bydeler: string[];
};

export const fetchPdlBydelsok = async (postnummer: string): Promise<BydelSokResponse | FetchErrorResponse> => {
	const authorizationHeader = await getAuthorizationHeader();

	if (!authorizationHeader) {
		return fetchErrorResponse(500, 'Failed to get authorization header');
	}

	return await fetchJson(
		serverUrls.bydelApi,
		{
			postnummer,
		},
		{
			headers: { Authorization: authorizationHeader },
		},
	);
};
