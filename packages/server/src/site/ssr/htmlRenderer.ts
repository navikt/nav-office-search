import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AppLocale } from '../../../../common/localization/types';
import { getTemplateWithDecorator, templatePath } from './templateBuilder';
import type { ViteDevServer } from 'vite';
import { buildMetaTags } from './metaTags';
import { pageRenders } from '../../metrics/metrics';
import { assertRenderable, placeholders } from './selfCheck';

export type HtmlRenderer = (locale: AppLocale, url?: string) => Promise<string>;

type SsrEntry = { render: (locale: AppLocale) => string };

const PAGE_CACHE_TTL_MS = 10 * 60 * 1000;

// The whitespace is so hydration doesn't depend on how index.html is formatted
const appPlaceholder = new RegExp(`\\s*${placeholders.app}\\s*`);

// Function replacers, since a string replacement would give $ in the markup a special meaning
export const processTemplate = (locale: AppLocale, templateHtml: string, appHtml: string) =>
	templateHtml
		.replace(placeholders.lang, () => locale)
		.replace(placeholders.meta, () => buildMetaTags(locale))
		.replace(appPlaceholder, () => appHtml);

/** Loads the SSR bundle and checks that it and the template can produce every page */
export const loadProdRenderer = async (): Promise<HtmlRenderer> => {
	const ssrEntry = path.resolve(process.cwd(), 'frontendDist', 'ssr', 'main-server.mjs');
	const { render }: SsrEntry = await import(ssrEntry);

	assertRenderable(readFileSync(templatePath, 'utf8'), render);

	const pages = new Map<AppLocale, { html: string; expires: number }>();

	return async (locale: AppLocale) => {
		const cached = pages.get(locale);
		if (cached && cached.expires > Date.now()) {
			return cached.html;
		}

		const template = await getTemplateWithDecorator(locale);
		try {
			const appHtml = render(locale);
			pageRenders.inc({ locale, outcome: 'ssr' });
			const html = processTemplate(locale, template, appHtml);
			pages.set(locale, { html, expires: Date.now() + PAGE_CACHE_TTL_MS });
			return html;
		} catch (e) {
			console.error(`Error occured while server rendering app! - ${e}`);
			pageRenders.inc({ locale, outcome: 'csr_fallback' });
			return processTemplate(locale, template, '');
		}
	};
};

export const devRender =
	(vite: ViteDevServer): HtmlRenderer =>
	async (locale: AppLocale, url = '') => {
		try {
			const template = await getTemplateWithDecorator(locale);
			// Development renders on the client only. `pnpm prod-local` has server rendering.
			const html = await vite.transformIndexHtml(url, template);
			return processTemplate(locale, html, '');
		} catch (e) {
			vite.ssrFixStacktrace(e as Error);
			console.error(e);
			throw e;
		}
	};
