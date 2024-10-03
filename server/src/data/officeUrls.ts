import { fetchJson } from '../utils/fetch';
import { serverUrls } from '../urls';

type OfficeInfoResponse = {
    offices: {
        enhetNr: string;
        path: string;
    }[];
    error: undefined;
};

type EnhetNrToOfficePathMap = { [enhetNr: string]: string };

let enhetsNrToOfficePathMap: EnhetNrToOfficePathMap = {};

export const loadOfficeUrls = async () => {
    console.log(`Loading office URLs from ${serverUrls.xpOfficeInfoApi}`);

    const officeUrls = await fetchJson<OfficeInfoResponse>(
        serverUrls.xpOfficeInfoApi
    );

    if (officeUrls?.error || !officeUrls?.offices) {
        console.error(`Failed to load office urls! - ${JSON.stringify(officeUrls)}`);
        return false;
    }

    const newOfficePathMap = officeUrls.offices.reduce(
        (acc, office) => ({
            ...acc,
            [office.enhetNr]: office.path,
        }),
        {} as EnhetNrToOfficePathMap
    );

    enhetsNrToOfficePathMap = newOfficePathMap;
    return true;
};

export const getOfficeUrl = (enhetNr: string) => {
    const path = enhetsNrToOfficePathMap[enhetNr];

    if (!path) {
        console.error(`No office url found for enhetnr ${enhetNr}!`);
        return null;
    }

    return `${process.env.VITE_NAVNO_ORIGIN}${path}`;
};
