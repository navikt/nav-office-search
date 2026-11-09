import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type ServerType, serve } from '@hono/node-server';
import { render } from '#client/main-server.tsx';
import { createApp } from './app.ts';
import { loadDataAndStartSchedule } from './data/data.ts';
import { env } from './env.ts';
import { builtAssets, type ViteManifest } from './site/ssr/document.ts';
import { prodRenderer } from './site/ssr/htmlRenderer.ts';
import { fetchNotFoundHtml } from './utils/errorHandlers.ts';

const manifest: ViteManifest = JSON.parse(
	readFileSync(new URL(import.meta.resolve('#dist/client/.vite/manifest.json')), 'utf-8'),
);

// First, since nothing else is worth doing when the build can't render its pages
const site = {
	render: prodRenderer(render, builtAssets(manifest)),
	clientDir: fileURLToPath(import.meta.resolve('#dist/client')),
};

loadDataAndStartSchedule()
	.then(async () => createApp({ site, notFoundHtml: await fetchNotFoundHtml() }))
	.catch((e) => {
		console.error(`Error occured while initializing server! - ${e}`);
		throw e;
	})
	.then((app) => {
		const server: ServerType = serve({ fetch: app.fetch, port: env.PORT, overrideGlobalObjects: false }, () => {
			console.log(`Server starting on port ${env.PORT}`);
		});

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
