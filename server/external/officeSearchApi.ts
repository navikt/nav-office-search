import { ORDER, order, type Plugin } from '@itsy/corgi';
import { REQUEST_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';
import { getAuthorizationHeader } from './auth.ts';

// The token, once per call. Outside the metrics: without a token the request isn't sent, so it isn't counted.
const withToken: Plugin = order(ORDER.retry - 1, (next) => async (url, init) => {
	const headers = new Headers(init?.headers);
	headers.set('authorization', await getAuthorizationHeader());
	return next(url, { ...init, headers });
});

/** nav-office-search-api's search, asked with a token from Texas */
export const officeSearchApi = upstreamClient('office-search-api/search', {
	timeout: REQUEST_TIMEOUT_MS,
	headers: { accept: 'application/json' },
	plugins: [withToken],
});
