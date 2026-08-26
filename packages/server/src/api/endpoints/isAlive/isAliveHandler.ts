import { RequestHandler } from 'express';

export const isAliveHandler: RequestHandler = (req, res) => {
    return res.status(200).send('I am alive!');
};
