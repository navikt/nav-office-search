import express, { Express } from 'express';
import { render } from '../../dist/server/main-server.js';
import { getTemplateWithDecorator } from './template-builder';

export const setupProdServer = async (expressApp: Express) => {
    expressApp.get('/internal/isAlive', (req, res) => {
        return res.status(200).send('I am alive!');
    });
    expressApp.get('/internal/isReady', (req, res) => {
        return res.status(200).send('I am ready!');
    });
    //
    expressApp.use(
        '/assets',
        express.static(`${process.cwd()}/../dist/client/assets`, {
            maxAge: '1y',
            index: 'false',
        })
    );

    expressApp.use('*', async (req, res, _) => {
        const template = await getTemplateWithDecorator('nb');

        const appHtml = render();

        const html = template.replace('<!--ssr-app-html-->', appHtml);

        return res.status(200).send(html);
    });
};
