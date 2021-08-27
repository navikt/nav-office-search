import { NextApiRequest, NextApiResponse } from 'next';

const isAliveHandler = (req: NextApiRequest, res: NextApiResponse) => {
    return res.status(200).json({ message: 'Ok!' });
};

export default isAliveHandler;
