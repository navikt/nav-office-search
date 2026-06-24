import { Router } from 'express';
import { isReadyHandler } from './endpoints/isReady/isReadyHandler';
import { isAliveHandler } from './endpoints/isAlive/isAliveHandler';
import { searchHandler } from './endpoints/search/searchHandler';
import { geoidSearchHandler } from './endpoints/geoid/geoidSearchHandler';
import { nameSearchHandler } from './endpoints/search/nameSearchHandler';
import { addressSearchHandler } from './endpoints/search/addressSearchHandler';
import { loginStatusHandler } from './endpoints/loginstatus/loginStatusHandler';
import { getKommunerArray } from '../data/kommuner';
import { getPoststedArray } from '../data/poststeder';
import { getBydelerArray } from '../data/bydeler';

export const registerApiRoutes = async (router: Router) => {
    router.get('/internal/isAlive', isAliveHandler);
    router.get('/internal/isReady', isReadyHandler);
    router.get('/search', searchHandler);

    router.get('/search/name', nameSearchHandler);
    router.get('/search/address', addressSearchHandler);

    router.get('/geoid', geoidSearchHandler);

    router.get('/loginstatus', loginStatusHandler);

    router.get('/data/kommuner', (req, res) => {
        res.status(200).json(getKommunerArray());
    });

    router.get('/data/poststeder', (req, res) => {
        res.status(200).json(getPoststedArray());
    });

    router.get('/data/bydeler', (req, res) => {
        res.status(200).json(getBydelerArray());
    });

    return Promise.resolve();
};
