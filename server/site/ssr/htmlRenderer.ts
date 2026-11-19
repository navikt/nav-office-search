import type { ElementEntry } from '@itsy/html/frame';
import type { AppLocale } from '#shared/localization/types.ts';
import { pageRenders } from '#server/metrics/metrics.ts';
import { fetchDecorator, renderDocument } from './document.ts';
import { prerender } from './prerender.ts';

/** env is what the server hands the request: nothing in production, and Vite's dev server in server/dev.ts */
export type HtmlRenderer = (locale: AppLocale, env?: unknown) => Promise<string>;

/**
 * Renders the app once for every locale, and throws unless it can. A request then only takes the decorator and puts
 * the document together around that markup. The decorator's module keeps the decorator, and fetches it again when a
 * new version is out, so a new one shows on the next request.
 */
export const prodRenderer = (renderApp: (locale: AppLocale) => string, assets: ElementEntry[]): HtmlRenderer => {
	const appHtml = prerender(renderApp);

	return async (locale: AppLocale) => {
		const decorator = await fetchDecorator(locale);
		const html = renderDocument({ locale, assets, decorator, appHtml: appHtml[locale] });
		pageRenders.inc({ locale, outcome: 'ssr' });
		return html;
	};
};
