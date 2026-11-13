import { ORDER, order, type Plugin } from '@itsy/corgi';
import { REQUEST_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';
import { getAuthorizationHeader } from './auth.ts';

// The token, once per call. Outside the metrics: without a token the request isn't sent, so it isn't counted.
const withToken: Plugin = order(ORDER.retry - 1, (next) => async (url, init) => {
	const authorization = await getAuthorizationHeader();
	if (!authorization) {
		throw new Error('No token for nav-office-search-api');
	}

	const headers = new Headers(init?.headers);
	headers.set('authorization', authorization);
	return next(url, { ...init, headers });
});

/** A client for one of nav-office-search-api's endpoints, with Azure AD's token */
export const officeSearchApi = (endpoint: 'geoid' | 'adresse' | 'bydel') =>
	upstreamClient(`office-search-api/${endpoint}`, {
		timeout: REQUEST_TIMEOUT_MS,
		headers: { accept: 'application/json' },
		plugins: [withToken],
	});
