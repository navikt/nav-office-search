import { NextApiRequest, NextApiResponse } from 'next';
import { getKommunerMap, getPostnrMap } from '../../data/data';
import { getBydelerData } from '../../data/bydeler';

const searchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({
        kommuner: getKommunerMap(),
        postnr: getPostnrMap(),
        bydeler: getBydelerData(),
    });
};

export default searchHandler;
