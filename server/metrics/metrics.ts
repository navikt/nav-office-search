import { collectDefaultMetrics, Counter, Registry } from '@prometheus-io/client';

/** Served on /internal/metrics (server/app.ts). The upstream metrics are made in it by server/utils/upstream.ts. */
export const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const metricPrefix = 'nav_office_search_';

// Searches

/** What the browser got. ok: an answer to a valid search, with or without hits. invalid: 4xx. error: 5xx. */
type SearchOutcome = 'ok' | 'invalid' | 'error';

export const searchRequests = new Counter({
	name: `${metricPrefix}search_requests_total`,
	help: 'Searches by outcome: ok (2xx), invalid (4xx) or error (5xx)',
	labelNames: ['outcome'] as const,
	registers: [registry],
});

const outcomeOf = (status: number): SearchOutcome => {
	if (status >= 500) {
		return 'error';
	}
	return status >= 400 ? 'invalid' : 'ok';
};

/**
 * Runs a search and records its outcome, by the status alone. The answer is nav-office-search-api's and isn't read
 * here: what a search found is counted there. How long it took is in the upstream durations.
 */
export const observeSearch = async <Response extends { status: number }>(search: () => Promise<Response>) => {
	try {
		const response = await search();
		searchRequests.inc({ outcome: outcomeOf(response.status) });
		return response;
	} catch (e) {
		searchRequests.inc({ outcome: 'error' });
		throw e;
	}
};

// Page renders

export const pageRenders = new Counter({
	name: `${metricPrefix}page_renders_total`,
	help: 'Pages served by locale and outcome: ssr, or error when the document could not be put together',
	labelNames: ['locale', 'outcome'] as const,
	registers: [registry],
});
