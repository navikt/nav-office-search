import { NextApiRequest, NextApiResponse } from 'next';
import { loadPostnrRegister } from '../../../data/postnrRegister';
import { loadBydelerData } from '../../../data/bydeler';
import { populateDataMaps } from '../../../data/kommuner';

let isReady = false;
let isLoading = false;

const isReadyHandler = (req: NextApiRequest, res: NextApiResponse) => {
    if (!isReady) {
        if (!isLoading) {
            isLoading = true;
            loadBydelerData(async () => {
                await loadPostnrRegister();
                await populateDataMaps();
                isReady = true;
                console.log(
                    'Finished loading data - application is ready to serve!'
                );
            });
        }
        return res.status(502).json({ message: 'Application not ready' });
    }

    return res.status(200).json({ message: 'Ok!' });
};

export default isReadyHandler;
