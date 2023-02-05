import dotenv from 'dotenv';
dotenv.config();

import express, { ErrorRequestHandler } from 'express';
import { registerSiteEndpoints } from './site/register-site-endpoints.js';
import { registerApiEndpoints } from './api/registerApiEndpoints';
import schedule from 'node-schedule';
import { loadData } from './data/data';

loadData().then(() => {
    schedule.scheduleJob({ hour: 6, minute: 0, second: 0 }, loadData);
});

const isLocal = process.env.ENV === 'localhost';
const basePath = process.env.VITE_APP_BASEPATH;

const PORT = 3005;
const app = express();
const router = express.Router();

app.use(basePath, router);

if (isLocal) {
    app.get('/', (req, res) => res.redirect(basePath));
}

registerApiEndpoints(router);
registerSiteEndpoints(router);

router.use('*', async (req, res) => {
    const error404 = await fetch(`${process.env.VITE_XP_ORIGIN}/404`).then(
        (response) => response.text()
    );
    res.status(404).send(error404);
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
