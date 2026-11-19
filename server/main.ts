// First, so console goes through the logger before anything else logs
import './utils/console.ts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { logger } from '@navikt/navno-logger';
import { render } from '#client/main-server.tsx';
import { createApp } from './app.ts';
import { env } from './env.ts';
import { builtAssets, type ViteManifest } from './site/ssr/document.ts';
import { prodRenderer } from './site/ssr/htmlRenderer.ts';
import { shutDownOnSignal } from './utils/shutdown.ts';

// Wonderwall, the sidecar in front of the app, drops a connection it hasn't used for 5 s, and the ingress drops one
// after 60 s. The app keeps them longer than both, so it never closes a connection a proxy is about to use.
const KEEP_ALIVE_TIMEOUT_MS = 65_000;

try {
	const manifest: ViteManifest = JSON.parse(
		readFileSync(new URL(import.meta.resolve('#dist/client/.vite/manifest.json')), 'utf-8'),
	);

	// First, since nothing else is worth doing when the build can't render its pages
	const site = {
		render: prodRenderer(render, builtAssets(manifest)),
		clientDir: fileURLToPath(import.meta.resolve('#dist/client')),
	};

	const app = createApp({ site });
	const server = serve(
		{
			fetch: app.fetch,
			port: env.PORT,
			overrideGlobalObjects: false,
			serverOptions: { keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS },
		},
		() => {
			logger.info('Server listening', { port: env.PORT });
		},
	);
	shutDownOnSignal(server);
} catch (e) {
	// Exits instead of rethrowing, which Node would print again as plain text
	logger.error('Server failed to start', e);
	process.exit(1);
}
