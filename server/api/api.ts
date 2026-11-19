import { type Context, type Handler, Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse } from './apiResponse.ts';
import { searchHandler } from './endpoints/search/searchHandler.ts';
import { loginStatusHandler } from './endpoints/loginstatus/loginStatusHandler.ts';
import { observeSearch } from '#server/metrics/metrics.ts';

const respond =
	(handler: (c: Context) => ApiResponse<object> | Promise<ApiResponse<object>>): Handler =>
	async (c) => {
		const { status, body } = await handler(c);

		return c.json(body, status as ContentfulStatusCode);
	};

// A repeated parameter counts as a missing one
const singleParam = (c: Context, name: string) => {
	const values = c.req.queries(name);
	return values?.length === 1 ? values[0] : undefined;
};

export const api = new Hono();

// The one search. A missing or repeated query is passed on as none, for the API to answer.
const search = respond((c) => observeSearch(() => searchHandler(singleParam(c, 'query'))));

api.get('/search', search);

// DEPRECATED: Fallback solution for one week-ish
api.get('/search/name', search);
api.get('/search/address', search);
api.get('/geoid', (c) =>
	c.json({
		type: 'postnr',
		officeInfo: [
			{
				name: 'Siden er oppdatert. Last den inn på nytt og søk igjen. / This page has been updated. Reload it and search again.',
				url: '?',
				enhetNr: '',
			},
		],
	}),
);

api.get(
	'/loginstatus',
	respond((c) => loginStatusHandler(c.req.header('cookie'))),
);
