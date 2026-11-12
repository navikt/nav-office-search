import { logger } from '@navikt/navno-logger';
import type { ViteDevServer } from 'vite';
import { render as renderApp } from '#client/main-server.tsx';
import { BASE_PATH } from '#shared/basePath.ts';
import { createApp } from './app.ts';
import { loadData } from './data/data.ts';
import { devAssets, fetchDecorator, renderDocument } from './site/ssr/document.ts';
import type { HtmlRenderer } from './site/ssr/htmlRenderer.ts';
import { fetchNotFoundHtml } from './utils/errorHandlers.ts';

// What @hono/vite-dev-server runs in `pnpm dev`, through Vite. An edit here, or in anything imported from here, runs this
// again on the next request.

// The plugin hands every request Vite's dev server
const render: HtmlRenderer = async (locale, env) => {
	const { vite } = env as { vite: ViteDevServer };
	try {
		const decorator = await fetchDecorator(locale);
		const html = renderDocument({ locale, assets: devAssets, decorator, appHtml: renderApp(locale) });
		// Vite adds its client and the base path. Its HTML parser objects to the decorator's </link> end tags, which browsers
		// ignore, and it only needs a URL for inline module scripts, which the page has none of.
		return await vite.transformIndexHtml('/', html.replace(/<\/link>/gi, ''));
	} catch (e) {
		vite.ssrFixStacktrace(e as Error);
		logger.error('Rendering failed', { locale }, e);
		throw e;
	}
};

await loadData();

const app = createApp({ site: { render }, notFoundHtml: await fetchNotFoundHtml() });

app.get('/', (c) => c.redirect(BASE_PATH));

export default app;
