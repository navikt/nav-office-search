import { isTimeoutError } from '@itsy/corgi';
import { collectDefaultMetrics, Counter, Histogram, Registry } from '@prometheus-io/client';
import type { Handler } from 'hono';

export const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const metricsHandler: Handler = async (c) =>
	c.body(await registry.metrics(), 200, { 'Content-Type': registry.contentType });

const prefix = 'nav_office_search_';

// Searches

// The one search route. Its label is from when there were more, and stays for the dashboards and alerts that read it.
const route = 'search';

/** hits: at least one office or address. empty: a valid search with nothing found. invalid: 4xx. error: 5xx. */
export type SearchOutcome = 'hits' | 'empty' | 'invalid' | 'error';

export const searchRequests = new Counter({
	name: `${prefix}search_requests_total`,
	help: 'Search API responses by route and outcome',
	labelNames: ['route', 'outcome'] as const,
	registers: [registry],
});

export const searchDuration = new Histogram({
	name: `${prefix}search_request_duration_seconds`,
	help: 'Search API response time, including upstream calls',
	labelNames: ['route'] as const,
	buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	registers: [registry],
});

const countOf = (value: unknown) => (Array.isArray(value) ? value.length : 0);

export const classifySearchResponse = (status: number, body: unknown): SearchOutcome => {
	if (status >= 500) {
		return 'error';
	}
	if (status >= 400) {
		return 'invalid';
	}

	const result = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
	switch (result.type) {
		case 'postnr':
			return countOf(result.officeInfo) > 0 ? 'hits' : 'empty';
		case 'name':
			return countOf(result.hits) > 0 ? 'hits' : 'empty';
		case 'adresse':
			return countOf(result.adresser) > 0 ? 'hits' : 'empty';
		default:
			return 'error';
	}
};

/** Runs a search and records its outcome and duration */
export const observeSearch = async <Response extends { status: number; body: unknown }>(
	search: () => Promise<Response>,
) => {
	const stopTimer = searchDuration.startTimer({ route });
	try {
		const response = await search();
		searchRequests.inc({ route, outcome: classifySearchResponse(response.status, response.body) });
		return response;
	} catch (e) {
		searchRequests.inc({ route, outcome: 'error' });
		throw e;
	} finally {
		stopTimer();
	}
};

// Upstream calls

export type Upstream = 'office-search-api/search' | 'texas' | 'login-session';

export const upstreamRequests = new Counter({
	name: `${prefix}upstream_requests_total`,
	help: 'Outbound requests by upstream and response status class (2xx, 4xx, 5xx, …), timeout or network_error',
	labelNames: ['upstream', 'status'] as const,
	registers: [registry],
});

export const upstreamDuration = new Histogram({
	name: `${prefix}upstream_request_duration_seconds`,
	help: 'Outbound request time until response headers, by upstream',
	labelNames: ['upstream'] as const,
	buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
	registers: [registry],
});

const statusClass = (status: number) => `${Math.floor(status / 100)}xx`;

/** Runs an outbound request and records its status class and time to response. upstreamClient() does this for its requests. */
export const observeUpstream = async (upstream: Upstream, request: () => Promise<Response>) => {
	const stopTimer = upstreamDuration.startTimer({ upstream });
	try {
		const response = await request();
		upstreamRequests.inc({ upstream, status: statusClass(response.status) });
		return response;
	} catch (e) {
		upstreamRequests.inc({ upstream, status: isTimeoutError(e) ? 'timeout' : 'network_error' });
		throw e;
	} finally {
		stopTimer();
	}
};

// Page renders

export const pageRenders = new Counter({
	name: `${prefix}page_renders_total`,
	help: 'Pages served by locale and outcome: ssr, or error when the document could not be put together',
	labelNames: ['locale', 'outcome'] as const,
	registers: [registry],
});
