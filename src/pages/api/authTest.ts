import { NextApiRequest, NextApiResponse } from 'next';
import { fetchToken } from '../../fetch/auth';

const authTest = async (req: NextApiRequest, res: NextApiResponse) => {
    const tokenData = await fetchToken();

    return res.status(200).json(tokenData);
};

export default authTest;
