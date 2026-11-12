import { logger } from '@navikt/navno-logger';
import type { ElementEntry } from '@itsy/html/frame';
import type { AppLocale } from '#shared/localization/types.ts';
import { pageRenders } from '#server/metrics/metrics.ts';
import { fetchDecorator, renderDocument } from './document.ts';
import { assertRenderable } from './selfCheck.ts';

/** env is what the server hands the request: nothing in production, and Vite's dev server in server/dev.ts */
export type HtmlRenderer = (locale: AppLocale, env?: unknown) => Promise<string>;

const PAGE_CACHE_TTL_MS = 10 * 60 * 1000;

/** Throws unless the app can render every page */
export const prodRenderer = (renderApp: (locale: AppLocale) => string, assets: ElementEntry[]): HtmlRenderer => {
	assertRenderable(renderApp);

	const pages = new Map<AppLocale, { html: string; expires: number }>();

	return async (locale: AppLocale) => {
		const cached = pages.get(locale);
		if (cached && cached.expires > Date.now()) {
			return cached.html;
		}

		const decorator = await fetchDecorator(locale);
		try {
			const appHtml = renderApp(locale);
			pageRenders.inc({ locale, outcome: 'ssr' });
			const html = renderDocument({ locale, assets, decorator, appHtml });
			pages.set(locale, { html, expires: Date.now() + PAGE_CACHE_TTL_MS });
			return html;
		} catch (e) {
			logger.error('Server rendering failed, leaving it to the browser', { locale }, e);
			pageRenders.inc({ locale, outcome: 'csr_fallback' });
			return renderDocument({ locale, assets, decorator, appHtml: '' });
		}
	};
};
