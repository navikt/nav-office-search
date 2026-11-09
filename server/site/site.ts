import { serveStatic } from '@hono/node-server/serve-static';
import { type Handler, Hono, type MiddlewareHandler } from 'hono';
import type { HtmlRenderer } from './ssr/htmlRenderer.ts';
import { pageRenders } from '#server/metrics/metrics.ts';
import { BASE_PATH } from '#shared/basePath.ts';
import type { AppLocale } from '#shared/localization/types.ts';

/** Serves the built client from clientDir. Without one, Vite serves it (server/dev.ts). */
export type Site = { render: HtmlRenderer; clientDir?: string };

// Not serveStatic's onFound: it runs after the response is made, and with overrideGlobalObjects: false (startServer.ts) a
// header set then doesn't reach it.
const cacheControl =
	(value: string): MiddlewareHandler =>
	async (c, next) => {
		await next();
		if (c.res.ok) {
			c.header('Cache-Control', value);
		}
	};

export const createSite = ({ render, clientDir }: Site) => {
	const site = new Hono();

	if (clientDir) {
		console.log('Configuring site endpoints for production mode');

		site.get(
			'/assets/*',
			// File names contain a content hash, so a file never changes
			cacheControl('public, max-age=31536000, immutable'),
			serveStatic({
				root: clientDir,
				// The build writes .br and .gz next to the files (precompressAssets in the client)
				precompressed: true,
				// serveStatic looks files up by the full request path, base path included
				rewriteRequestPath: (requestPath) => requestPath.slice(BASE_PATH.length),
			}),
		);
		// No hash in this name, so a new favicon has to get through
		site.get(
			'/favicon.ico',
			cacheControl('public, max-age=86400'),
			serveStatic({ root: clientDir, path: 'favicon.ico' }),
		);
	} else {
		console.log('Configuring site endpoints for development mode');
	}

	const page =
		(locale: AppLocale): Handler =>
		async (c) => {
			try {
				return c.html(await render(locale, c.env));
			} catch (e) {
				pageRenders.inc({ locale, outcome: 'error' });
				throw e;
			}
		};

	site.get('/', page('nb'));
	site.get('/nn', page('nn'));
	site.get('/en', page('en'));

	return site;
};
