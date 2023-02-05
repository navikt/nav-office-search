import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import express, { ErrorRequestHandler } from 'express';
import { registerSiteEndpoints } from './site/register-site-endpoints.js';
import { registerApiEndpoints } from './api/endpoints/registerApiEndpoints';
import schedule from 'node-schedule';
import { loadData } from './data/data';

const PORT = 3100;

const app = express();

loadData().then(() => {
    schedule.scheduleJob({ hour: 6, minute: 0, second: 0 }, loadData);
    registerApiEndpoints(app);
    registerSiteEndpoints(app);
});

app.use(((err, req, res, _) => {
    const { path } = req;
    const { status, stack } = err;
    const msg = stack?.split('\n')[0];

    console.log(`Express error on path ${path}: ${status} ${msg}`);

    const statusCode = status || 500;

    res.status(statusCode);

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
