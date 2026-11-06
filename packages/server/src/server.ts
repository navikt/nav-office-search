import { type ServerType, serve } from '@hono/node-server';
import { createApp } from './app';
import { behindVite, prepareSite } from './site/site';
import { loadDataAndStartSchedule } from './data/data';
import { fetchNotFoundHtml } from './utils/errorHandlers';

const PORT = 3005;

prepareSite()
	.then(async (site) => {
		await loadDataAndStartSchedule();

		return { site, app: createApp({ site, notFoundHtml: await fetchNotFoundHtml() }) };
	})
	.catch((e) => {
		console.error(`Error occured while initializing server! - ${e}`);
		throw e;
	})
	.then(({ site, app }) => {
		const server: ServerType = serve(
			{
				fetch: app.fetch,
				port: PORT,
				overrideGlobalObjects: false,
				createServer: site.vite && behindVite(site.vite),
			},
			() => {
				console.log(`Server starting on port ${PORT}`);
			},
		);

		const shutdown = () => {
			console.log('Server shutting down');

			server.close(() => {
				console.log('Shutdown complete!');
				process.exit(0);
			});
		};

		process.on('SIGTERM', shutdown);
		process.on('SIGINT', shutdown);
	});
