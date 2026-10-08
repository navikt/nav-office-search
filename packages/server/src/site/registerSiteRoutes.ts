import express, { Router } from 'express';
import { createServer } from 'vite';
import { HtmlRenderer, devRender, prodRender } from './ssr/htmlRenderer';
import { createCacheMiddleware } from '../utils/cacheMiddleware';
import { pageRenders } from '../metrics/metrics';
import { AppLocale } from '../../../common/localization/types';

const assetsDir = `${process.cwd()}/frontendDist/client/assets`;
const favicon = `${process.cwd()}/frontendDist/client/favicon.ico`;

const isProd = process.env.NODE_ENV !== 'development';

export const registerSiteRoutes = async (router: Router) => {
	let render: HtmlRenderer;

	if (isProd) {
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

		render = prodRender;
	} else {
		console.log('Configuring site endpoints for development mode');

		const vite = await createServer({
			server: { middlewareMode: true },
			appType: 'custom',
			root: '../client',
		});

		router.use(vite.middlewares);

		render = devRender(vite);
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
