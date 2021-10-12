import { loadBydelerData } from './bydeler';
import { getPostnrRegister } from './postnrRegister';
import { loadOfficeUrls } from './officeUrls';
import { loadKommuneData } from './kommuner';
import { loadPoststederData } from './poststeder';

let isLoaded = false;
let isLoading = false;

export const loadData = async () => {
    if (!isLoading) {
        isLoading = true;

        console.log('Started loading data!');

        await loadOfficeUrls();
        await loadBydelerData();
        const postnrRegister = await getPostnrRegister();
        await loadKommuneData(postnrRegister);
        await loadPoststederData(postnrRegister);

        isLoaded = true;

        console.log('Finished loading data!');
    }
};

export const isDataLoaded = () => isLoaded;
