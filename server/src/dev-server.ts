import { Express } from 'express';
import { createServer } from 'vite';
import { getTemplateWithDecorator } from './template-builder';

export const setupDevServer = async (expressApp: Express) => {
    const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
        root: '../',
    });

    expressApp.use(vite.middlewares);

    expressApp.use('*', async (req, res, next) => {
        const url = req.originalUrl;

        try {
            let template = await getTemplateWithDecorator({});

            template = await vite.transformIndexHtml(url, template);

            const { render } = await vite.ssrLoadModule('/src/main-server.tsx');

            const appHtml = await render(url);

            const html = template.replace(`<!--ssr-app-html-->`, appHtml);

            res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (e) {
            vite.ssrFixStacktrace(e as Error);
            next(e);
        }
    });
};
