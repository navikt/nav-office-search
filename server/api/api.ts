import { type Context, type Handler, Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse } from './apiResponse.ts';
import { isReadyHandler } from './endpoints/isReady/isReadyHandler.ts';
import { isAliveHandler } from './endpoints/isAlive/isAliveHandler.ts';
import { searchHandler } from './endpoints/search/searchHandler.ts';
import { geoidSearchHandler } from './endpoints/geoid/geoidSearchHandler.ts';
import { nameSearchHandler } from './endpoints/search/nameSearchHandler.ts';
import { addressSearchHandler } from './endpoints/search/addressSearchHandler.ts';
import { loginStatusHandler } from './endpoints/loginstatus/loginStatusHandler.ts';
import { getKommunerArray } from '#server/data/kommuner.ts';
import { getPoststedArray } from '#server/data/poststeder.ts';
import { getBydelerArray } from '#server/data/bydeler.ts';
import { metricsHandler, observeSearch, type SearchRoute } from '#server/metrics/metrics.ts';

const respond =
	(handler: (c: Context) => ApiResponse | Promise<ApiResponse>): Handler =>
	async (c) => {
		const { status, body } = await handler(c);
		const contentfulStatus = status as ContentfulStatusCode;

		return typeof body === 'string' ? c.html(body, contentfulStatus) : c.json(body as object, contentfulStatus);
	};

// A repeated parameter counts as a missing one
const singleParam = (c: Context, name: string) => {
	const values = c.req.queries(name);
	return values?.length === 1 ? values[0] : undefined;
};

const searchRoute = (route: SearchRoute, param: string, handler: (value?: string) => Promise<ApiResponse>) =>
	respond((c) => observeSearch(route, () => handler(singleParam(c, param))));

export const api = new Hono();

api.get('/internal/isAlive', respond(isAliveHandler));
api.get('/internal/isReady', respond(isReadyHandler));
api.get('/internal/metrics', metricsHandler);

api.get('/search', searchRoute('search', 'query', searchHandler));
api.get('/search/name', searchRoute('search/name', 'query', nameSearchHandler));
api.get('/search/address', searchRoute('search/address', 'query', addressSearchHandler));
api.get('/geoid', searchRoute('geoid', 'id', geoidSearchHandler));

api.get(
	'/loginstatus',
	respond((c) => loginStatusHandler(c.req.header('cookie'))),
);

api.get(
	'/data/kommuner',
	respond(() => ({ status: 200, body: getKommunerArray() })),
);
api.get(
	'/data/poststeder',
	respond(() => ({ status: 200, body: getPoststedArray() })),
);
api.get(
	'/data/bydeler',
	respond(() => ({ status: 200, body: getBydelerArray() })),
);
