import { NextApiRequest, NextApiResponse } from 'next';
import { isDataLoaded, loadData } from '../../../data/data';

const isReadyHandler = (req: NextApiRequest, res: NextApiResponse) => {
    if (!isDataLoaded()) {
        loadData(() => {
            console.log(
                'Finished loading data - application is ready to serve!'
            );
        });

        return res.status(502).json({ message: 'Application not ready' });
    }

    return res.status(200).json({ message: 'Ok!' });
};

export default isReadyHandler;
