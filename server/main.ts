// First, so console goes through the logger before anything else logs
import './utils/console.ts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type ServerType, serve } from '@hono/node-server';
import { logger } from '@navikt/navno-logger';
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

try {
	await loadDataAndStartSchedule();
	const app = createApp({ site, notFoundHtml: await fetchNotFoundHtml() });
	const server: ServerType = serve({ fetch: app.fetch, port: env.PORT, overrideGlobalObjects: false }, () => {
		logger.info('Server listening', { port: env.PORT });
	});
	setupShutdownHandlers(server);
} catch (e) {
	logger.error('Server failed to start', e);
	throw e;
}

function setupShutdownHandlers(server: ServerType) {
	const shutdown = () => {
		logger.info('Server shutting down');
		server.close(() => {
			logger.info('Shutdown complete!');
			process.exit(0);
		});
	};
	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}
