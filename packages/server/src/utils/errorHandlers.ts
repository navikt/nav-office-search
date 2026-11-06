import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

// Fetch static 404-page from the nav.no frontend
export const fetchNotFoundHtml = () =>
	fetch(`${process.env.VITE_NAVNO_ORIGIN}/404`)
		.then((res) => {
			if (res.status === 404) {
				return res.text();
			}

			throw Error(`${res.status} ${res.statusText}`);
		})
		.catch((e) => {
			console.error(`Failed to fetch 404 html - ${e}`);
			return 'Not found';
		});

export const setupErrorHandlers = (app: Hono, notFoundHtml: string) => {
	app.notFound((c) => c.html(notFoundHtml, 404));

	app.onError((err, c) => {
		const { path } = c.req;
		const statusCode = err instanceof HTTPException ? err.status : 500;
		const msg = err.stack?.split('\n')[0];

		if (statusCode < 500) {
			console.log(`Invalid request to ${path}: ${statusCode} ${msg}`);
			return c.html(notFoundHtml, 404);
		}

		console.error(`Server error on ${path}: ${statusCode} ${msg}`);

		// TODO: Html for server errors
		return c.body(null, statusCode);
	});
};
