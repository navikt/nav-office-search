import { AppLocale } from '../../../../common/localization/types';
import { getTemplateWithDecorator } from './templateBuilder';
import { ViteDevServer } from 'vite';
import { buildMetaTags } from './metaTags';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - build artifact, only exists post-build
import { render } from '../../../frontendDist/ssr/main-server.js';

export type HtmlRenderer = (locale: AppLocale, url?: string) => Promise<string>;

const metaPlaceholder = '<!--ssr-meta-->';

const processTemplate = async (locale: AppLocale, templateHtml: string, appHtml: string) => {
    if (!templateHtml.includes(metaPlaceholder)) {
        console.error(
            `Meta tag placeholder "${metaPlaceholder}" not found in template - page will render without title and social meta tags!`
        );
    }

    return templateHtml
        .replace('%%LANG%%', locale)
        .replace(metaPlaceholder, buildMetaTags(locale))
        .replace('<!--ssr-app-html-->', appHtml);
};

export const prodRender: HtmlRenderer = async (locale: AppLocale) => {
    const template = await getTemplateWithDecorator(locale);
    try {
        const appHtml = await render(locale);
        return processTemplate(locale, template, appHtml);
    } catch (e) {
        console.error(`Error occured while server rendering app! - ${e}`);
        return processTemplate(locale, template, '');
    }
};

export const devRender =
    (vite: ViteDevServer): HtmlRenderer =>
    async (locale: AppLocale, url = '') => {
        try {
            const template = await getTemplateWithDecorator(locale);
            // SSR with Vite dev mode does not play nice with preact/compat and
            // certain react modules. We use CSR for now
            // Uncomment or run in production mode to use SSR locally
            // const { render } = await vite.ssrLoadModule('/src/main-server.tsx');
            // const appHtml = await render(locale);
            const html = await vite.transformIndexHtml(url, template);
            return processTemplate(locale, html, '');
        } catch (e) {
            vite.ssrFixStacktrace(e as Error);
            console.error(e);
            throw e;
        }
    };
