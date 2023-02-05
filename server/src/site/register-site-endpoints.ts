import express, { Express } from 'express';
import { render } from '../../../dist/server/main-server.js';
import { getTemplateWithDecorator } from './html-template-builder';
import { AppLocale } from '../../../src-common/localization/types';
import { localeString } from '../../../src-common/localization/localeString';
import { createServer, ViteDevServer } from 'vite';

const isProd = process.env.NODE_ENV !== 'development';

const assetsDir = `${process.cwd()}/../dist/client/assets`;

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
            console.log('1');
            const template = await getTemplateWithDecorator(locale);
            console.log('2');
            // const { render } = await vite.ssrLoadModule('/src/main-server.tsx');
            // console.log('3');
            // const appHtml = await render(locale);
            console.log('4');
            const html = await vite.transformIndexHtml(url, template);
            console.log('5');
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
        .replace('%%TITLE%%', localeString('pageTitle', locale))
        .replace('<!--ssr-app-html-->', appHtml);
};

export const registerSiteEndpoints = async (expressApp: Express) => {
    let render: HtmlRenderer;

    if (isProd) {
        console.log('Configuring site endpoints for production mode');

        expressApp.use(
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

        expressApp.use(vite.middlewares);

        render = devRender(vite);
    }

    expressApp.get('/', async (req, res) => {
        console.log('Hello');
        const html = await render('nb', req.originalUrl);
        return res.status(200).send(html);
    });

    expressApp.get('/en', async (req, res) => {
        const html = await render('en', req.originalUrl);
        return res.status(200).send(html);
    });
};
