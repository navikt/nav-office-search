import { NextApiRequest, NextApiResponse } from 'next';
import { getBydelerArray } from '../../../api/data/bydeler';
import { getKommunerArray } from '../../../api/data/kommuner';
import { getPoststedArray } from '../../../api/data/poststeder';

const searchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({
        kommuner: getKommunerArray(),
        postnr: getPoststedArray(),
        bydeler: getBydelerArray(),
    });
};

export default searchHandler;
