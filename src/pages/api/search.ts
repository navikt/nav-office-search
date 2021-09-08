import { NextApiRequest, NextApiResponse } from 'next';
import { isPostnrQuery } from '../../utils/utils';
import { SearchResultProps } from '../../types/searchResult';
import { postnrSearchHandler } from '../../api/postnr-search-handler';
import { apiErrorResponse } from '../../api/utils';
import { nameSearchHandler } from '../../api/name-search-handler';
import { isDataLoaded, loadData } from '../../api/data/data';

const searchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultProps>
) => {
    if (!isDataLoaded()) {
        loadData();
        console.log('Application not ready');
        return res.status(500).send(apiErrorResponse('errorServerError'));
    }

    try {
        const { query } = req.query;

        if (typeof query !== 'string') {
            return res.status(400).send(apiErrorResponse('errorMissingQuery'));
        }

        if (isPostnrQuery(query)) {
            return postnrSearchHandler(req, res);
        }

        return nameSearchHandler(req, res);
    } catch (e) {
        console.error(`Search api error: ${e}`);
        return res.status(500).send(apiErrorResponse('errorServerError'));
    }
};

export default searchHandler;
