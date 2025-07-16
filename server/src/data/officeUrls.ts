import { fetchJson } from '../utils/fetch';
import { serverUrls } from '../urls';

type OfficeInfoResponse = {
    offices: Array<{
        enhetNr: string;
        path: string;
    }>;
    error: undefined;
};

type EnhetNrToOfficePathMap = Record<string, string>;

let enhetsNrToOfficePathMap: EnhetNrToOfficePathMap = {};

export const loadOfficeUrls = async () => {
    try {
        console.log(`Loading office URLs from ${serverUrls.xpOfficeInfoApi}`);

        const officeUrls = await fetchJson<OfficeInfoResponse>(
            serverUrls.xpOfficeInfoApi
        );

        if (officeUrls?.error || !officeUrls?.offices) {
            const msg = `Failed to load office urls! - ${JSON.stringify(officeUrls)}`;

            if (Object.keys(enhetsNrToOfficePathMap).length === 0) {
                throw new Error(msg);
            }

            console.error(`${msg} - keepings current data`);
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
    } catch (error) {
        const msg = `Error loading office URLs: ${error instanceof Error ? error.message : String(error)}`;

        if (Object.keys(enhetsNrToOfficePathMap).length === 0) {
            throw new Error(msg);
        }

        console.error(`${msg} - keeping current data`);
    }
};

export const getOfficeUrl = (enhetNr: string) => {
    const path = enhetsNrToOfficePathMap[enhetNr];

    if (!path) {
        console.error(`No office url found for enhetnr ${enhetNr}!`);
        return null;
    }

    return `${process.env.VITE_NAVNO_ORIGIN}${path}`;
};
