import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { api } from './api/api';
import { createSite, type Site } from './site/site';
import { setupErrorHandlers } from './utils/errorHandlers';

type Deps = {
	site: Site;
	notFoundHtml: string;
};

export const createApp = ({ site, notFoundHtml }: Deps) => {
	const basePath = process.env.VITE_APP_BASEPATH;

	// strict: false matches routes with or without a trailing slash
	const app = new Hono({ strict: false });
	app.use(compress());

	// Redirect from root to basepath in local development environments
	if (process.env.ENV === 'localhost') {
		app.get('/', (c) => c.redirect(basePath));
	}

	const base = app.basePath(basePath);
	base.route('/api', api);
	base.route('/', createSite(site));

	setupErrorHandlers(app, notFoundHtml);

	return app;
};
