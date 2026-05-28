import { getNameSearchResult } from './nameSearchHandler';
import { isDataLoaded, loadData } from '../../../data/data';
import { RequestHandler } from 'express';
import { apiErrorResponse } from '../../../utils/fetch';
import { isValidPostnrQuery } from '../../../../../common/validateInput';
import { postnrSearchHandler } from './postnrSearchHandler';
import { addressSearchHandler } from './addressSearchHandler';

export const searchHandler: RequestHandler = async (req, res) => {
    console.log('Received search request');
    if (!isDataLoaded()) {
        console.log('Application not ready');
        await loadData();
    }

    try {
        const { query } = req.query;
        const sanitizedQueryForLog =
            typeof query === 'string' ? query.replace(/[\r\n]/g, '') : String(query);

        console.log(`Received search query: ${sanitizedQueryForLog}`);

        if (typeof query !== 'string' || !query.trim()) {
            return res.status(400).send(apiErrorResponse('errorMissingQuery'));
        }

        if (isValidPostnrQuery(query)) {
            return postnrSearchHandler(req, res);
        }

        const nameResult = getNameSearchResult(query);
        if (nameResult.hits.length > 0) {
            return res.status(200).send(nameResult);
        }

        return addressSearchHandler(req, res);
    } catch (e) {
        console.error(`Search api error: ${e}`);
        return res.status(500).send(apiErrorResponse('errorServerError'));
    }
};
