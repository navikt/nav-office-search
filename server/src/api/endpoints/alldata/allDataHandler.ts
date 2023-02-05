import { RequestHandler } from 'express';
import { getKommunerArray } from '../../../data/kommuner';
import { getPoststedArray } from '../../../data/poststeder';
import { getBydelerArray } from '../../../data/bydeler';

export const allDataHandler: RequestHandler = async (req, res) => {
    res.status(200).json({
        kommuner: getKommunerArray(),
        postnr: getPoststedArray(),
        bydeler: getBydelerArray(),
    });
};
