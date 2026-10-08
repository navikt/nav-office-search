import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from '@prometheus-io/client';

export const registry = new Registry();

collectDefaultMetrics({ register: registry });

const prefix = 'nav_office_search_';

// Searches

export type SearchRoute = 'search' | 'search/name' | 'search/address' | 'geoid';

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

// Upstream calls

export type Upstream =
	| 'office-search-api/geoid'
	| 'office-search-api/adresse'
	| 'office-search-api/bydel'
	| 'xp'
	| 'ssb'
	| 'bring'
	| 'azure-token'
	| 'login-session'
	| 'other';

export const upstreamRequests = new Counter({
	name: `${prefix}upstream_requests_total`,
	help: 'Outbound requests by upstream and response status class (2xx, 4xx, 5xx, …) or network_error',
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

const upstreamPatterns: [RegExp, Upstream][] = [
	[/\/geoid(\?|$)/, 'office-search-api/geoid'],
	[/\/adresse(\?|$)/, 'office-search-api/adresse'],
	[/\/bydel(\?|$)/, 'office-search-api/bydel'],
	[/\/_\/service\/no\.nav\.navno\/officeInfo/, 'xp'],
	[/^https:\/\/data\.ssb\.no\//, 'ssb'],
	[/\/oauth2\/v2\.0\/token/, 'azure-token'],
];

export const upstreamForUrl = (url: string): Upstream =>
	upstreamPatterns.find(([pattern]) => pattern.test(url))?.[1] ?? 'other';

const statusClass = (status: number) => `${Math.floor(status / 100)}xx`;

/** Runs an outbound request and records its status class and time to response */
export const observeUpstream = async (upstream: Upstream, request: () => Promise<Response>) => {
	const stopTimer = upstreamDuration.startTimer({ upstream });
	try {
		const response = await request();
		upstreamRequests.inc({ upstream, status: statusClass(response.status) });
		return response;
	} catch (e) {
		upstreamRequests.inc({ upstream, status: 'network_error' });
		throw e;
	} finally {
		stopTimer();
	}
};

// Page renders

export const pageRenders = new Counter({
	name: `${prefix}page_renders_total`,
	help: 'Page renders by locale and outcome (ssr, csr_fallback when server rendering failed, error). Cached pages are not counted.',
	labelNames: ['locale', 'outcome'] as const,
	registers: [registry],
});

// Reference data (postnummerregister, kommuner, bydeler, office URLs)

export const dataLoads = new Counter({
	name: `${prefix}data_loads_total`,
	help: 'Reference data loads (startup and the daily refresh) by outcome',
	labelNames: ['outcome'] as const,
	registers: [registry],
});

export const dataLoadDuration = new Gauge({
	name: `${prefix}data_load_duration_seconds`,
	help: 'Duration of the last successful reference data load',
	registers: [registry],
});

export const dataLastSuccess = new Gauge({
	name: `${prefix}data_last_success_timestamp_seconds`,
	help: 'Unix time of the last successful reference data load',
	registers: [registry],
});

export const referenceDataEntries = new Gauge({
	name: `${prefix}reference_data_entries`,
	help: 'Entries in the loaded reference data, by dataset',
	labelNames: ['dataset'] as const,
	registers: [registry],
});

export const referenceDataWithoutOffice = new Gauge({
	name: `${prefix}reference_data_without_office`,
	help: 'Kommuner, bydeler and poststeder the last load could not find an office for',
	labelNames: ['dataset'] as const,
	registers: [registry],
});
