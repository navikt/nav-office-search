import { Router } from 'express';
import { isReadyHandler } from './endpoints/isReady/isReadyHandler';
import { isAliveHandler } from './endpoints/isAlive/isAliveHandler';
import { allDataHandler } from './endpoints/allData/allDataHandler';
import { searchHandler } from './endpoints/search/searchHandler';

export const registerApiRoutes = (router: Router) => {
    router.get('/internal/isAlive', isAliveHandler);
    router.get('/internal/isReady', isReadyHandler);
    router.get('/internal/allData', allDataHandler);
    router.get('/search', searchHandler);
};
