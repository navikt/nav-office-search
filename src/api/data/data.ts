import { loadBydelerData } from './bydeler';
import { getPostnrRegister } from './postnrRegister';
import { loadOfficeInfo } from './officeInfo';
import { loadKommuneData } from './kommuner';
import { loadPoststederData } from './poststeder';

let isLoaded = false;
let isLoading = false;

export const loadData = async () => {
    if (!isLoading) {
        console.log('Started loading data!');
        isLoading = true;

        await loadOfficeInfo();
        await loadBydelerData();
        const postnrRegister = await getPostnrRegister();
        await loadKommuneData(postnrRegister);
        await loadPoststederData(postnrRegister);

        isLoading = false;
        isLoaded = true;

        console.log('Finished loading data!');
    }
};

export const isDataLoaded = () => isLoaded;
