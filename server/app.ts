import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { BASE_PATH } from '#shared/basePath.ts';
import { api } from './api/api.ts';
import { createSite, type Site } from './site/site.ts';
import { setupErrorHandlers } from './utils/errorHandlers.ts';

type Deps = {
	site: Site;
	notFoundHtml: string;
};

export const createApp = ({ site, notFoundHtml }: Deps) => {
	// strict: false matches routes with or without a trailing slash
	const app = new Hono({ strict: false });
	app.use(compress());

	const base = app.basePath(BASE_PATH);
	base.route('/api', api);
	base.route('/', createSite(site));

	setupErrorHandlers(app, notFoundHtml);

	return app;
};
