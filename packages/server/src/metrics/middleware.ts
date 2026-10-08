import type { RequestHandler } from 'express';
import { classifySearchResponse, registry, type SearchRoute, searchDuration, searchRequests } from './metrics';

const searchRoutes: Record<string, SearchRoute> = {
	'/search': 'search',
	'/search/name': 'search/name',
	'/search/address': 'search/address',
	'/geoid': 'geoid',
};

/**
 * Records outcome and duration for the search endpoints. Mount on the API router before the routes.
 * The handlers send their result with res.send/res.json, so the first body passed to either is captured and
 * classified once the response has finished.
 */
export const searchMetrics: RequestHandler = (req, res, next) => {
	// Express routing is case-insensitive and ignores a trailing slash
	const route = searchRoutes[req.path.toLowerCase().replace(/(.)\/$/, '$1')];
	if (!route) {
		return next();
	}

	const stopTimer = searchDuration.startTimer({ route });
	let body: unknown;
	// res.send(obj) calls res.json(obj), and res.json(obj) calls res.send with the serialized string; keep the
	// first payload, which is the object either way
	const capture =
		<Method extends (payload?: unknown) => unknown>(method: Method) =>
		(payload?: unknown) => {
			body ??= payload;
			return method(payload);
		};
	res.send = capture(res.send.bind(res)) as typeof res.send;
	res.json = capture(res.json.bind(res)) as typeof res.json;

	res.on('finish', () => {
		stopTimer();
		searchRequests.inc({ route, outcome: classifySearchResponse(res.statusCode, body) });
	});

	next();
};

export const metricsHandler: RequestHandler = async (_req, res) => {
	res.set('Content-Type', registry.contentType);
	res.send(await registry.metrics());
};
