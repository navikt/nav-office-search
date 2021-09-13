import { loadBydelerData } from './bydeler';
import { getPostnrRegister } from './postnrRegister';
import { loadOfficeUrls } from './officeUrls';
import { loadKommuneData } from './kommuner';
import { loadPoststedData } from './poststed';

let isLoaded = false;
let isLoading = false;

export const loadData = async () => {
    if (!isLoading) {
        console.log('Started loading data!');
        isLoading = true;

        await loadOfficeUrls();
        await loadBydelerData();
        const postnrRegister = await getPostnrRegister();
        await loadKommuneData(postnrRegister);
        await loadPoststedData(postnrRegister);

        isLoading = false;
        isLoaded = true;

        console.log('Finished loading data!');
    }
};

export const isDataLoaded = () => isLoaded;
