import { NextApiRequest, NextApiResponse } from 'next';
import { responseFromPostnrSearch } from '../../../fetch/search-postnr';

const postnrSearchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse
) => {
    const { postnr } = req.query;

    if (typeof postnr !== 'string') {
        return res.status(400).json({ message: 'Missing postnr parameter' });
    }

    return responseFromPostnrSearch(postnr, res);
};

export default postnrSearchHandler;
