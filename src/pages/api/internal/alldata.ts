import { NextApiRequest, NextApiResponse } from 'next';
import { getPostnrArray } from '../../../api/data/data';
import { getBydelerArray } from '../../../api/data/bydeler';
import { getKommunerArray } from '../../../api/data/kommuner';

const searchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({
        kommuner: getKommunerArray(),
        postnr: getPostnrArray(),
        bydeler: getBydelerArray(),
    });
};

export default searchHandler;
