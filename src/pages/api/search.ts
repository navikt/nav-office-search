import { NextApiRequest, NextApiResponse } from 'next';
import { responseFromPostnrSearch } from '../../fetch/postnr';

type SearchParams = {
    postnr?: string;
    name?: string;
};

const searchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { postnr, name } = req.query as SearchParams;

    if (!postnr && !name) {
        return res
            .status(400)
            .json({ message: 'No valid parameters provided' });
    }

    if (postnr) {
        return responseFromPostnrSearch(postnr, res);
    }

    return res.status(200);
};

export default searchHandler;
