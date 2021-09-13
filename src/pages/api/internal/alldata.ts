import { NextApiRequest, NextApiResponse } from 'next';
import { getBydelerArray } from '../../../api/data/bydeler';
import { getKommunerArray } from '../../../api/data/kommuner';
import { getPostnrArray } from '../../../api/data/poststed';

const searchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({
        kommuner: getKommunerArray(),
        postnr: getPostnrArray(),
        bydeler: getBydelerArray(),
    });
};

export default searchHandler;
