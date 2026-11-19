import { logger } from '@navikt/navno-logger';
import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

/** Answers an unknown path, and a request Hono refuses, with a plain 404. A thrown error gets an empty 500. */
export const setupErrorHandlers = (app: Hono) => {
	app.notFound((c) => c.text('Not found', 404));

	app.onError((err, c) => {
		const { method, path } = c.req;
		const statusCode = err instanceof HTTPException ? err.status : 500;

		if (statusCode < 500) {
			logger.info('Invalid request', { method, path, status: statusCode, error: String(err) });
			return c.text('Not found', 404);
		}

		logger.error('Request failed', { method, path, status: statusCode }, err);

		// TODO: Html for server errors
		return c.body(null, statusCode);
	});
};
