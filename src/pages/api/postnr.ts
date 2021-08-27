import { NextApiRequest, NextApiResponse } from 'next';
import { responseFromPostnrSearch } from '../../fetch/postnr';

type Params = {
    postnr?: string;
};

const postnrSearchHandler = async (
    req: NextApiRequest,
    res: NextApiResponse
) => {
    const { postnr } = req.query as Params;

    if (!postnr) {
        return res
            .status(400)
            .json({ message: 'No valid parameters provided' });
    }

    return responseFromPostnrSearch(postnr, res);
};

export default postnrSearchHandler;
