import express, { Router } from 'express';
import { render } from '../../frontendDist/ssr/main-server.js';
import { getTemplateWithDecorator } from './html-template-builder';
import { AppLocale } from '../../../common/localization/types';
import { localeString } from '../../../common/localization/localeString';
import { createServer, ViteDevServer } from 'vite';

const isProd = process.env.NODE_ENV !== 'development';

const assetsDir = `${process.cwd()}/frontendDist/client/assets`;

type HtmlRenderer = (locale: AppLocale, url?: string) => Promise<string>;

const prodRender: HtmlRenderer = async (locale: AppLocale) => {
    const template = await getTemplateWithDecorator(locale);
    const appHtml = render(locale);
    return processTemplate(locale, template, appHtml);
};

const devRender =
    (vite: ViteDevServer): HtmlRenderer =>
    async (locale: AppLocale, url = '') => {
        try {
            const template = await getTemplateWithDecorator(locale);
            // SSR in dev mode is very glitchy -_-
            // Run in production mode to test SSR
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

const processTemplate = async (
    locale: AppLocale,
    templateHtml: string,
    appHtml: string
) => {
    return templateHtml
        .replace('%%LANG%%', locale)
        .replace('%%TITLE%%', localeString('documentTitle', locale))
        .replace('<!--ssr-app-html-->', appHtml);
};

export const registerSiteEndpoints = async (router: Router) => {
    let render: HtmlRenderer;

    if (isProd) {
        console.log('Configuring site endpoints for production mode');

        router.use(
            '/assets',
            express.static(assetsDir, {
                maxAge: '1y',
                index: 'false',
            })
        );

        render = prodRender;
    } else {
        console.log('Configuring site endpoints for development mode');

        const vite = await createServer({
            server: { middlewareMode: true },
            appType: 'custom',
            root: '../',
        });

        router.use(vite.middlewares);

        render = devRender(vite);
    }

    router.get('/', async (req, res) => {
        const html = await render('nb', req.originalUrl);
        return res.status(200).send(html);
    });

    router.get('/en', async (req, res) => {
        const html = await render('en', req.originalUrl);
        return res.status(200).send(html);
    });
};
