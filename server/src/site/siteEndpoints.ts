import express, { Router } from 'express';
import { createServer } from 'vite';
import { HtmlRenderer, devRender, prodRender } from './ssr/htmlRenderer';
import { createCacheMiddleware } from '../utils/cacheMiddleware';

const assetsDir = `${process.cwd()}/frontendDist/client/assets`;

const isProd = process.env.NODE_ENV !== 'development';

export const siteEndpoints = async (router: Router) => {
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

    router.use('*', createCacheMiddleware({ ttlSec: 10, maxSize: 1000 }));

    router.get('/', async (req, res) => {
        const html = await render('nb', req.originalUrl);
        return res.status(200).send(html);
    });

    router.get('/en', async (req, res) => {
        const html = await render('en', req.originalUrl);
        return res.status(200).send(html);
    });
};
