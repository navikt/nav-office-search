import { logger } from '@navikt/navno-logger';
import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { env } from '#server/env.ts';

// Fetch static 404-page from the nav.no frontend
export const fetchNotFoundHtml = () =>
	fetch(`${env.NAVNO_ORIGIN}/404`)
		.then((res) => {
			if (res.status === 404) {
				return res.text();
			}

			throw Error(`${res.status} ${res.statusText}`);
		})
		.catch((e) => {
			logger.error('Failed to fetch 404 html', e);
			return 'Not found';
		});

export const setupErrorHandlers = (app: Hono, notFoundHtml: string) => {
	app.notFound((c) => c.html(notFoundHtml, 404));

	app.onError((err, c) => {
		const { method, path } = c.req;
		const statusCode = err instanceof HTTPException ? err.status : 500;

		if (statusCode < 500) {
			logger.info('Invalid request', { method, path, status: statusCode, error: String(err) });
			return c.html(notFoundHtml, 404);
		}

		logger.error('Request failed', { method, path, status: statusCode }, err);

		// TODO: Html for server errors
		return c.body(null, statusCode);
	});
};
