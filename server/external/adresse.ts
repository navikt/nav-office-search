import { getAuthorizationHeader } from './auth.ts';
import type { Adresse } from '#shared/types/results.ts';
import { fetchErrorResponse, type FetchErrorResponse, fetchJson } from '#server/utils/fetch.ts';
import { serverUrls } from '#server/urls.ts';

export type AdresseSokResponse = {
	adresser: Adresse[];
	totalHits: number;
};

export const fetchPdlAdresseSok = async (adresse: string): Promise<AdresseSokResponse | FetchErrorResponse> => {
	const authorizationHeader = await getAuthorizationHeader();

	if (!authorizationHeader) {
		return fetchErrorResponse(500, 'Failed to get authorization header');
	}

	return await fetchJson(
		serverUrls.adresseApi,
		{
			queryString: adresse,
		},
		{
			headers: { Authorization: authorizationHeader },
		},
	);
};
