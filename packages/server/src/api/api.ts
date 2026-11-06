import { type Context, type Handler, Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse } from './apiResponse';
import { isReadyHandler } from './endpoints/isReady/isReadyHandler';
import { isAliveHandler } from './endpoints/isAlive/isAliveHandler';
import { searchHandler } from './endpoints/search/searchHandler';
import { geoidSearchHandler } from './endpoints/geoid/geoidSearchHandler';
import { nameSearchHandler } from './endpoints/search/nameSearchHandler';
import { addressSearchHandler } from './endpoints/search/addressSearchHandler';
import { loginStatusHandler } from './endpoints/loginstatus/loginStatusHandler';
import { getKommunerArray } from '../data/kommuner';
import { getPoststedArray } from '../data/poststeder';
import { getBydelerArray } from '../data/bydeler';
import { metricsHandler, observeSearch, type SearchRoute } from '../metrics/metrics';

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
