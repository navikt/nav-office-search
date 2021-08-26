import { NextApiRequest, NextApiResponse } from 'next';
import { fetchAccessToken } from '../../fetch/auth';

const authTest = async (req: NextApiRequest, res: NextApiResponse) => {
    const tokenData = await fetchAccessToken();

    return res.status(200).json(tokenData);
};

export default authTest;
