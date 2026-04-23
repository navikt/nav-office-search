import { postnrSearchHandler } from './postnrSearchHandler';
import { nameSearchHandler } from './nameSearchHandler';
import { isDataLoaded, loadData } from '../../../data/data';
import { RequestHandler } from 'express';
import { apiErrorResponse } from '../../../utils/fetch';
import {
    isValidNameQuery,
    isValidPostnrQuery,
} from '../../../../../common/validateInput';
import { addressSearchHandler } from './addressSearchHandler';

export const searchHandler: RequestHandler = async (req, res) => {
    console.log('Received search request');
    if (!isDataLoaded()) {
        console.log('Application not ready');
        await loadData();
    }

    try {
        const { query } = req.query;

        console.log(`Received search query: ${query}`);

        if (typeof query !== 'string') {
            return res.status(400).send(apiErrorResponse('errorMissingQuery'));
        }

        if (query) {
            return addressSearchHandler(req, res);
        }

        if (isValidPostnrQuery(query)) {
            return postnrSearchHandler(req, res);
        }

        if (isValidNameQuery(query)) {
            return nameSearchHandler(req, res);
        }

        return res.status(400).send(apiErrorResponse('errorInvalidQuery'));
    } catch (e) {
        console.error(`Search api error: ${e}`);
        return res.status(500).send(apiErrorResponse('errorServerError'));
    }
};
