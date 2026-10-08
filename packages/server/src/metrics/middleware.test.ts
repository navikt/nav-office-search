import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import { registry, searchDuration, searchRequests } from './metrics';
import { metricsHandler, searchMetrics } from './middleware';

let baseUrl = '';
let close: () => void = () => undefined;

beforeAll(async () => {
	const app = express();
	const api = express.Router();
	app.use('/finn-nav-kontor/api', api);
	api.use(searchMetrics);
	api.get('/internal/metrics', metricsHandler);
	api.get('/search', (_req, res) => res.status(200).send({ type: 'postnr', officeInfo: [] }));
	api.get('/search/name', (_req, res) =>
		res.status(200).json({ type: 'name', hits: [{ name: 'OSLO', officeHits: [] }] }),
	);
	api.get('/search/address', (_req, res) => res.status(503).send({ type: 'error', messageId: 'errorServerError' }));
	api.get('/geoid', (_req, res) => res.status(400).send({ type: 'error', messageId: 'errorInvalidQuery' }));
	api.get('/loginstatus', (_req, res) => res.status(200).json({ isUserLoggedIn: false }));

	const server = app.listen(0);
	await new Promise((resolve) => server.once('listening', resolve));
	baseUrl = `http://localhost:${(server.address() as AddressInfo).port}/finn-nav-kontor/api`;
	close = () => server.close();
});

afterAll(() => close());

beforeEach(() => {
	registry.resetMetrics();
});

const get = async (path: string) => {
	const response = await fetch(`${baseUrl}${path}`);
	await response.text();
	return response;
};

test('counts each search route by outcome and times it', async () => {
	await get('/search?query=9170');
	await get('/search/name?query=oslo');
	// Express routing is case-insensitive and ignores a trailing slash
	await get('/Search/Name/?query=oslo');
	await get('/search/address?query=storgata');
	await get('/geoid');
	await get('/loginstatus');

	const counted = (await searchRequests.get()).values.map(({ labels, value }) => {
		const { route, outcome } = labels as Record<string, string>;
		return [route, outcome, value];
	});
	expect(counted).toEqual(
		expect.arrayContaining([
			['search', 'empty', 1],
			['search/name', 'hits', 2],
			['search/address', 'error', 1],
			['geoid', 'invalid', 1],
		]),
	);
	expect((await searchRequests.get()).values).toHaveLength(4);
	const timed = (await searchDuration.get()).values.filter(({ metricName }) => metricName?.endsWith('_count'));
	expect(timed.reduce((sum, { value }) => sum + value, 0)).toBe(5);
});

test('serves the registry in Prometheus text format', async () => {
	await get('/search?query=9170');

	const response = await fetch(`${baseUrl}/internal/metrics`);
	const text = await response.text();

	expect(response.headers.get('content-type')).toContain('text/plain');
	expect(text).toContain('nav_office_search_search_requests_total{route="search",outcome="empty"} 1');
	expect(text).toContain('nodejs_eventloop_lag_seconds');
});
