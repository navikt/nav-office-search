// First, so console goes through the logger before anything else logs
import './utils/console.ts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { logger } from '@navikt/navno-logger';
import { serve } from '@navikt/navno-server';
import { render } from '#client/main-server.tsx';
import { createApp } from './app.ts';
import { env } from './env.ts';
import { builtAssets, type ViteManifest } from './site/ssr/document.ts';
import { prodRenderer } from './site/ssr/htmlRenderer.ts';

try {
	const manifest: ViteManifest = JSON.parse(
		readFileSync(new URL(import.meta.resolve('#dist/client/.vite/manifest.json')), 'utf-8'),
	);

	// First, since nothing else is worth doing when the build can't render its pages
	const site = {
		render: prodRenderer(render, builtAssets(manifest)),
		clientDir: fileURLToPath(import.meta.resolve('#dist/client')),
	};

	// Logs the port, and has the team's keep-alive and shutdown on SIGTERM and SIGINT
	serve(createApp({ site }), { port: env.PORT, overrideGlobalObjects: false });
} catch (e) {
	// Exits instead of rethrowing, which Node would print again as plain text
	logger.error('Server failed to start', e);
	process.exit(1);
}
