import { loadBydelerData } from './bydeler';
import { getPostnrRegister, loadPostnrRegister } from './postnrRegister';
import { loadOfficeUrls } from './officeUrls';
import { loadKommuneData } from './kommuner';
import { loadPoststederData } from './poststeder';
import schedule from 'node-schedule';

let isLoaded = false;
let isLoading = false;

export const loadData = async () => {
    if (isLoading) {
        return;
    }

    isLoading = true;
    console.log('Started loading data!');

    try {
        await loadOfficeUrls();
        await loadBydelerData();
        await loadPostnrRegister();

        const postnrRegister = getPostnrRegister();
        await loadKommuneData(postnrRegister);
        await loadPoststederData(postnrRegister);
        console.log('Finished loading data!');
    } catch (e) {
        console.error(`Error loading data - ${e}`);
        throw e;
    } finally {
        isLoaded = true;
        isLoading = false;
    }
};

export const loadDataAndStartSchedule = () =>
    loadData().then(() => {
        schedule.scheduleJob({ hour: 6, minute: 0, second: 0 }, loadData);
    });

export const isDataLoaded = () => isLoaded;
