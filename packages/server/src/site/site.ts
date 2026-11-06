import { createServer, type RequestListener, type ServerOptions } from 'node:http';
import path from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
import { type Handler, Hono, type MiddlewareHandler } from 'hono';
import type { Connect, ViteDevServer } from 'vite';
import { type HtmlRenderer, devRender, loadProdRenderer } from './ssr/htmlRenderer';
import { pageRenders } from '../metrics/metrics';
import type { AppLocale } from '../../../common/localization/types';

const isProd = process.env.NODE_ENV !== 'development';

/** Production serves the built client from clientDir. In development, Vite serves it (see behindVite). */
export type Site = { render: HtmlRenderer; clientDir?: string; vite?: ViteDevServer };

/** Rejects if a production build can't render its pages, so run this first: nothing else is worth doing then */
export const prepareSite = async (): Promise<Site> => {
	if (isProd) {
		return { render: await loadProdRenderer(), clientDir: path.resolve(process.cwd(), 'frontendDist', 'client') };
	}

	// Vite is a devDependency, and not in the image
	const { createServer: createViteServer } = await import('vite');
	const vite = await createViteServer({
		server: { middlewareMode: true },
		appType: 'custom',
		root: '../client',
	});

	return { render: devRender(vite), vite };
};

/** An HTTP server where Vite answers what it knows, like the client code, and the app answers the rest */
export const behindVite = (vite: ViteDevServer) =>
	((options: ServerOptions, listener: RequestListener) =>
		createServer(options, (req, res) => {
			vite.middlewares(req, res, () => {
				// Vite removes the base path, which the app needs
				req.url = (req as Connect.IncomingMessage).originalUrl;
				listener(req, res);
			});
		})) as typeof createServer;

// File names contain a content hash, so a file never changes. Not serveStatic's onFound: it runs after the response is
// made, and with overrideGlobalObjects: false (server.ts) a header set then doesn't reach it.
const cacheForAYear: MiddlewareHandler = async (c, next) => {
	await next();
	if (c.res.ok) {
		c.header('Cache-Control', 'public, max-age=31536000');
	}
};

export const createSite = ({ render, clientDir }: Site) => {
	const site = new Hono();

	if (clientDir) {
		console.log('Configuring site endpoints for production mode');

		site.get(
			'/assets/*',
			cacheForAYear,
			serveStatic({
				root: clientDir,
				// serveStatic looks files up by the full request path, base path included
				rewriteRequestPath: (requestPath) => requestPath.slice(process.env.VITE_APP_BASEPATH.length),
			}),
		);
		site.get('/favicon.ico', cacheForAYear, serveStatic({ root: clientDir, path: 'favicon.ico' }));
	} else {
		console.log('Configuring site endpoints for development mode');
	}

	const page =
		(locale: AppLocale): Handler =>
		async (c) => {
			try {
				return c.html(await render(locale));
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
