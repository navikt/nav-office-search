import dotenv from 'dotenv';
dotenv.config();

import express, { ErrorRequestHandler } from 'express';
import { siteEndpoints } from './site/siteEndpoints.js';
import { apiEndpoints } from './api/apiEndpoints';
import { loadDataAndStartSchedule } from './data/data';
import { createCacheMiddleware } from './utils/cacheMiddleware';

loadDataAndStartSchedule();

const isLocal = process.env.ENV === 'localhost';
const basePath = process.env.VITE_APP_BASEPATH;

const PORT = 3005;

const app = express();
const siteRouter = express.Router();
const apiRouter = express.Router();

app.use(basePath, siteRouter);
siteRouter.use('/api', apiRouter);

// Redirect from root to basepath locally
if (isLocal) {
    app.get('/', (req, res) => res.redirect(basePath));
}

apiEndpoints(apiRouter);
siteEndpoints(siteRouter).then(() => {
    siteRouter.use(
        '*',
        createCacheMiddleware({
            cacheOnErrors: true,
            ttlSec: 600,
            maxSize: 100,
        }),
        async (req, res) => {
            const error404 = await fetch(
                `${process.env.VITE_XP_ORIGIN}/404`
            ).then((response) => response.text());
            res.status(404).send(error404);
        }
    );
});

app.use(((err, req, res, _) => {
    const { path } = req;
    const { status, stack } = err;
    const msg = stack?.split('\n')[0];

    console.log(`Express error on path ${path}: ${status} ${msg}`);

    const statusCode = status || 500;

    res.status(statusCode);

    // TODO: Side for server-feil
    return res.send('Oh noes!');
}) as ErrorRequestHandler);

const server = app.listen(PORT, () => {
    console.log(`Server starting on port ${PORT}`);
});

const shutdown = () => {
    console.log('Server shutting down');

    server.close(() => {
        console.log('Shutdown complete!');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
