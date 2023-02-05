import { Router } from 'express';
import { isReadyHandler } from './isReady/isReadyHandler';
import { isAliveHandler } from './isAlive/isAliveHandler';
import { allDataHandler } from './alldata/allDataHandler';
import { searchHandler } from './search/searchHandler';

export const registerApiEndpoints = (expressApp: Router) => {
    expressApp.get('/internal/isAlive', isAliveHandler);

    expressApp.get('/internal/isReady', isReadyHandler);

    expressApp.get('/api/search', searchHandler);

    expressApp.get('/api/alldata', allDataHandler);
};
