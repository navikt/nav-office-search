import { NextApiRequest, NextApiResponse } from 'next';
import { getBydelerMap, getKommunerMap, getPostnrMap } from '../../data/data';

const searchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({
        kommuner: getKommunerMap(),
        postnr: getPostnrMap(),
        bydeler: getBydelerMap(),
    });
};

export default searchHandler;
