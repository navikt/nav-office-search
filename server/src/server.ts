import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { registerSiteRoutes } from './site/registerSiteRoutes.js';
import { registerApiRoutes } from './api/registerApiRoutes';
import { loadDataAndStartSchedule } from './data/data';
import { registerErrorHandlers } from './utils/errorHandlers';

loadDataAndStartSchedule();

const isLocal = process.env.ENV === 'localhost';
const basePath = process.env.VITE_APP_BASEPATH;

const PORT = 3005;

const app = express();
const siteRouter = express.Router();
const apiRouter = express.Router();

app.use(basePath, siteRouter);
siteRouter.use('/api', apiRouter);

// Redirect from root to basepath in local development environments
if (isLocal) {
    app.get('/', (req, res) => res.redirect(basePath));
}

registerApiRoutes(apiRouter);
registerSiteRoutes(siteRouter).then(() => registerErrorHandlers(app));

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
