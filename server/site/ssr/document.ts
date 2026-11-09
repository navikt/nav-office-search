import { raw } from '@itsy/html';
import { type ElementEntry, frame } from '@itsy/html/frame';
import { type DecoratorElements, fetchDecoratorHtml } from '@navikt/nav-dekoratoren-moduler/ssr/index.js';
import { BASE_PATH } from '#shared/basePath.ts';
import { getDecoratorParams } from '#shared/decoratorParams.ts';
import { pageMeta } from '#shared/localization/meta.ts';
import type { AppLocale } from '#shared/localization/types.ts';
import { env } from '#server/env.ts';

const shareImageUrl = 'https://www.nav.no/gfx/social-share-fallback.png';

const localePaths: { [key in AppLocale]: string } = {
	nb: '',
	nn: '/nn',
	en: '/en',
};

// 'prod' everywhere: in a cluster the module reaches that cluster's decorator through service discovery, and elsewhere it
// uses www.nav.no/dekoratoren
export const fetchDecorator = (locale: AppLocale) =>
	fetchDecoratorHtml({ env: 'prod', params: getDecoratorParams(locale) });

const favicon = (href: string): ElementEntry => ({ tag: 'link', attrs: { rel: 'shortcut icon', href } });

const moduleScript = (src: string): ElementEntry => ({ tag: 'script', attrs: { type: 'module', src } });

const stylesheet = (href: string): ElementEntry => ({ tag: 'link', attrs: { rel: 'stylesheet', href } });

/**
 * Vite serves the client's source in development, and adds its own client and the base path (server/dev.ts). The script
 * brings the styles too, but the stylesheet saves most of the flash of unstyled markup until it has run.
 */
export const devAssets: ElementEntry[] = [
	favicon('/favicon.ico'),
	moduleScript('/client/main-client.tsx'),
	stylesheet('/client/global.css'),
];

export type ViteManifest = Record<string, { file: string; css?: string[] } | undefined>;

/** The client build's files, from its manifest. Throws without them, so a broken build never takes traffic. */
export const builtAssets = (manifest: ViteManifest): ElementEntry[] => {
	const entry = manifest['client/main-client.tsx'];
	if (!entry) {
		throw new Error("client/main-client.tsx is missing from the client build's manifest");
	}

	const url = (file: string) => `${BASE_PATH}/${file}`;

	return [
		favicon(url('favicon.ico')),
		moduleScript(url(entry.file)),
		...(entry.css ?? []).map((file) => stylesheet(url(file))),
	];
};

const metaTags = (locale: AppLocale): ElementEntry[] => {
	const { documentTitle: title, ingressLine1: description } = pageMeta[locale];
	const origin = env.APP_ORIGIN;
	const domain = origin.replace(/^https?:\/\/(www\.)?/, '');
	const named = (name: string, content: string): ElementEntry => ({ tag: 'meta', attrs: { name, content } });
	const property = (name: string, content: string): ElementEntry => ({
		tag: 'meta',
		attrs: { property: name, content },
	});

	return [
		named('robots', 'noindex, nofollow'),
		property('og:title', title),
		property('og:description', description),
		property('og:site_name', domain),
		property('og:url', `${origin}${BASE_PATH}${localePaths[locale]}`),
		property('og:image', shareImageUrl),
		property('og:image:width', '200'),
		property('og:image:height', '200'),
		named('twitter:card', 'summary'),
		named('twitter:domain', domain),
		named('twitter:title', title),
		named('twitter:description', description),
		named('twitter:image:src', shareImageUrl),
	];
};

const fontPreload: ElementEntry = {
	tag: 'link',
	attrs: {
		rel: 'preload',
		href: 'https://cdn.nav.no/aksel/fonts/SourceSans3-normal.woff2',
		as: 'font',
		type: 'font/woff2',
		crossorigin: true,
	},
};

type Page = {
	locale: AppLocale;
	assets: ElementEntry[];
	decorator: DecoratorElements;
	/** Markup for <main>: the server-rendered app, or nothing for the browser to render it */
	appHtml: string;
};

export const renderDocument = ({ locale, assets, decorator, appHtml }: Page) =>
	frame({
		lang: locale,
		title: pageMeta[locale].documentTitle,
		description: pageMeta[locale].ingressLine1,
		head: [fontPreload, ...metaTags(locale), ...assets, raw(decorator.DECORATOR_HEAD_ASSETS)],
		header: raw(decorator.DECORATOR_HEADER),
		content: raw(appHtml),
		footer: raw(decorator.DECORATOR_FOOTER),
		scripts: raw(decorator.DECORATOR_SCRIPTS),
	}).markup;
