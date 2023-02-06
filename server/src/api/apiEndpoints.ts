import { Router } from 'express';
import { isReadyHandler } from './endpoints/isReady/isReadyHandler';
import { isAliveHandler } from './endpoints/isAlive/isAliveHandler';
import { allDataHandler } from './endpoints/alldata/allDataHandler';
import { searchHandler } from './endpoints/search/searchHandler';

export const apiEndpoints = (router: Router) => {
    router.get('/internal/isAlive', isAliveHandler);
    router.get('/internal/isReady', isReadyHandler);
    router.get('/search', searchHandler);
    router.get('/alldata', allDataHandler);
};
