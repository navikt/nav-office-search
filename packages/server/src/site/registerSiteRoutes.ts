import express, { type Router } from 'express';
import type { ViteDevServer } from 'vite';
import { type HtmlRenderer, devRender, loadProdRenderer } from './ssr/htmlRenderer';
import { createCacheMiddleware } from '../utils/cacheMiddleware';
import { pageRenders } from '../metrics/metrics';
import type { AppLocale } from '../../../common/localization/types';

const assetsDir = `${process.cwd()}/frontendDist/client/assets`;
const favicon = `${process.cwd()}/frontendDist/client/favicon.ico`;

const isProd = process.env.NODE_ENV !== 'development';

export type Site = { render: HtmlRenderer; vite?: ViteDevServer };

/** Rejects if a production build can't render its pages, so run this first: nothing else is worth doing then */
export const prepareSite = async (): Promise<Site> => {
	if (isProd) {
		return { render: await loadProdRenderer() };
	}

	// Vite is a devDependency, and not in the image
	const { createServer } = await import('vite');
	const vite = await createServer({
		server: { middlewareMode: true },
		appType: 'custom',
		root: '../client',
	});

	return { render: devRender(vite), vite };
};

export const registerSiteRoutes = ({ render, vite }: Site, router: Router) => {
	if (vite) {
		console.log('Configuring site endpoints for development mode');

		router.use(vite.middlewares);
	} else {
		console.log('Configuring site endpoints for production mode');

		router.use(
			'/assets',
			express.static(assetsDir, {
				maxAge: '1y',
				index: 'false',
			}),
		);

		router.use(
			'/favicon.ico',
			express.static(favicon, {
				maxAge: '1y',
				index: 'false',
			}),
		);
	}

	router.use(createCacheMiddleware({ ttlSec: 600, maxSize: 2 }));

	const renderPage = async (locale: AppLocale, url: string) => {
		try {
			return await render(locale, url);
		} catch (e) {
			pageRenders.inc({ locale, outcome: 'error' });
			throw e;
		}
	};

	router.get('/', async (req, res) => {
		const html = await renderPage('nb', req.originalUrl);
		const sanitizedOriginalUrl = req.originalUrl.replace(/[\r\n]/g, '');
		console.log(`Rendered HTML for ${sanitizedOriginalUrl}`);
		return res.status(200).send(html);
	});

	router.get('/nn', async (req, res) => {
		const html = await renderPage('nn', req.originalUrl);
		return res.status(200).send(html);
	});

	router.get('/en', async (req, res) => {
		const html = await renderPage('en', req.originalUrl);
		return res.status(200).send(html);
	});
};
