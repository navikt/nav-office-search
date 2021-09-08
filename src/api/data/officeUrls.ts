import Cache from 'node-cache';
import { fetchJson } from '../fetch/fetch-json';

const apiUrl = `${process.env.ORIGIN}${process.env.XP_OFFICE_INFO_API}`;

const oneHour = 3600;
const tenMinutes = 600;

const cacheKey = 'postnrRegister';
const cache = new Cache({
    stdTTL: oneHour,
    deleteOnExpire: false,
});

cache.on('expired', () => {
    loadOfficeUrls();
});

type OfficeUrlsResponse = {
    paths: {
        enhetNr: string;
        path: string;
    }[];
    error: undefined;
};

type EnhetNrToOfficePathMap = { [enhetNr: string]: string };

export const loadOfficeUrls = async () => {
    console.log('Loading office URLs');

    const officeUrls = await fetchJson<OfficeUrlsResponse>(apiUrl);

    if (officeUrls.error) {
        console.error('Failed to load office urls, retrying in 10 minutes');
        cache.ttl(cacheKey, tenMinutes);
        return;
    }

    const enhetNrToPathMap = officeUrls.paths.reduce(
        (acc, office) => ({
            ...acc,
            [office.enhetNr]: office.path,
        }),
        {}
    );

    cache.set(cacheKey, enhetNrToPathMap, oneHour);
};

export const getOfficeUrl = (enhetNr: string) => {
    const path = cache.get<EnhetNrToOfficePathMap>(cacheKey)?.[enhetNr];

    if (!path) {
        return '';
    }

    return `${process.env.XP_ORIGIN}${path}`;
};
