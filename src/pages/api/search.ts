import { NextApiRequest, NextApiResponse } from 'next';
import { SearchResultProps } from '../../types/results';
import { postnrSearchHandler } from '../../api/postnr-search-handler';
import { apiErrorResponse } from '../../api/utils';
import { nameSearchHandler } from '../../api/name-search-handler';
import { isDataLoaded, loadData } from '../../api/data/data';
import {
    isValidNameQuery,
    isValidPostnrQuery,
} from '../../utils/validateInput';

const searchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultProps>
) => {
    if (!isDataLoaded()) {
        console.log('Application not ready');
        await loadData();
    }

    try {
        const { query } = req.query;

        if (typeof query !== 'string') {
            return res.status(400).send(apiErrorResponse('errorMissingQuery'));
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

export default searchHandler;
