import { loadBydelerData } from './bydeler';
import { getPostnrRegister, loadPostnrRegister } from './postnrRegister';
import { loadOfficeUrls } from './officeUrls';
import { loadKommuneData } from './kommuner';
import { loadPoststederData } from './poststeder';

let isLoaded = false;
let isLoading = false;

export const loadData = async () => {
    if (isLoading) {
        return;
    }

    isLoading = true;

    console.log('Started loading data!');

    await loadOfficeUrls();
    await loadBydelerData();
    await loadPostnrRegister();

    const postnrRegister = getPostnrRegister();
    await loadKommuneData(postnrRegister);
    await loadPoststederData(postnrRegister);

    isLoaded = true;
    isLoading = false;

    console.log('Finished loading data!');
};

export const isDataLoaded = () => isLoaded;
