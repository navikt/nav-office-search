import { fetchJson } from '../api/utils/fetch-utils';
import { urls } from '../../../src-common/urls';

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
    console.log('Loading office URLs');

    const officeUrls = await fetchJson<OfficeInfoResponse>(
        urls.xpOfficeInfoApi
    );

    if (officeUrls?.error || !officeUrls?.offices) {
        console.error('Failed to load office urls, retrying in 10 minutes');
        return;
    }

    const newOfficePathMap = officeUrls.offices.reduce(
        (acc, office) => ({
            ...acc,
            [office.enhetNr]: office.path,
        }),
        {} as EnhetNrToOfficePathMap
    );

    enhetsNrToOfficePathMap = newOfficePathMap;
};

export const getOfficeUrl = (enhetNr: string) => {
    const path = enhetsNrToOfficePathMap[enhetNr];

    if (!path) {
        console.error(`No office url found for enhetnr ${enhetNr}!`);
        return null;
    }

    return `${process.env.XP_ORIGIN}${path}`;
};
