import { corgi } from '@itsy/corgi';
import { withTimeout } from '@itsy/corgi/timeout';
import { logger } from '@navikt/navno-logger';
import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serverUrls } from '#server/urls.ts';
import { REQUEST_TIMEOUT_MS } from './upstream.ts';

const navno = corgi.create({ plugins: [withTimeout(REQUEST_TIMEOUT_MS)] });

/** The nav.no frontend's 404 page, to answer unknown paths with. A plain "Not found" when it can't be had. */
export const fetchNotFoundHtml = async () => {
	try {
		const response = await navno.raw(serverUrls.notFoundPage);
		if (response.status === 404) {
			return await response.text();
		}

		void response.body?.cancel().catch(() => undefined);
		logger.error('Failed to fetch 404 html', { status: response.status });
	} catch (e) {
		logger.error('Failed to fetch 404 html', e);
	}

	return 'Not found';
};

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
