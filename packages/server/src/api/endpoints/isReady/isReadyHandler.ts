import { RequestHandler } from 'express';
import { isDataLoaded } from '../../../data/data';

export const isReadyHandler: RequestHandler = (req, res) => {
    if (!isDataLoaded()) {
        return res.status(502).json({ message: 'I am not ready...' });
    }

    return res.status(200).json({ message: 'I am ready!' });
};
