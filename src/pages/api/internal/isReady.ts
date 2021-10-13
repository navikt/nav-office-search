import { NextApiRequest, NextApiResponse } from 'next';
import schedule from 'node-schedule';
import { isDataLoaded, loadData } from '../../../api/data/data';

const isReadyHandler = (req: NextApiRequest, res: NextApiResponse) => {
    if (!isDataLoaded()) {
        loadData().then(() => {
            schedule.scheduleJob({ hour: 6, minute: 0, second: 0 }, loadData);
        });

        return res.status(502).json({ message: 'Application not ready' });
    }

    return res.status(200).json({ message: 'Ok!' });
};

export default isReadyHandler;
