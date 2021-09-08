import { NextApiRequest, NextApiResponse } from 'next';
import {
    getBydelerArray,
    getKommunerArray,
    getPostnrArray,
} from '../../api/data/data';

const searchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({
        kommuner: getKommunerArray(),
        postnr: getPostnrArray(),
        bydeler: getBydelerArray(),
    });
};

export default searchHandler;
