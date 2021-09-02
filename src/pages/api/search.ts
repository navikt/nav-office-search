import { NextApiRequest, NextApiResponse } from 'next';
import { isPostnrQuery } from '../../utils';
import { SearchResultProps } from '../../types/searchResult';
import { postnrSearchHandler } from '../../api/postnr';
import { apiErrorResponse } from '../../api/utils';

const searchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultProps>
) => {
    try {
        const { query } = req.query;

        if (typeof query !== 'string') {
            return res.status(400).send(apiErrorResponse('errorMissingQuery'));
        }

        if (isPostnrQuery(query)) {
            return postnrSearchHandler(req, res);
        }

        return res.status(400).send(apiErrorResponse('errorInvalidQuery'));
    } catch (e) {
        console.error(`Search api error: ${e}`);
        return res.status(500).send(apiErrorResponse('errorServerError'));
    }
};

export default searchHandler;
