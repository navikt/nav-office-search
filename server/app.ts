import { internal, traceRoutes } from '@navikt/navno-server';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { BASE_PATH } from '#shared/basePath.ts';
import { api } from './api/api.ts';
import { registry } from './metrics/metrics.ts';
import { createSite, type Site } from './site/site.ts';
import { setupErrorHandlers } from './utils/errorHandlers.ts';

type Deps = {
	site: Site;
};

export const createApp = ({ site }: Deps) => {
	// strict: false matches routes with or without a trailing slash
	const app = new Hono({ strict: false });

	// Make OTel in Nais work
	app.use(traceRoutes());
	app.use(compress());

	// The probes and the metrics, for NAIS. Outside the base path, so the ingress never sends anyone here.
	app.route('/internal', internal({ registry }));

	const base = app.basePath(BASE_PATH);
	base.route('/api', api);
	base.route('/', createSite(site));

	setupErrorHandlers(app);

	return app;
};
