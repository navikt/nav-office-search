import Cache from 'node-cache';
import { fetchJson } from '../fetch/fetch-json';
import { urls } from '../../urls';
import { OfficeInfo } from '../../types/data';

const oneHour = 3600;
const tenMinutes = 600;

const cacheKey = 'officeinfo';
const cache = new Cache({
    stdTTL: oneHour,
    deleteOnExpire: false,
});

cache.on('expired', () => {
    loadOfficeInfo();
});

type XpOfficeInfoResponse = {
    offices: {
        name: string;
        enhetNr: string;
        url: string;
        path: string;
    }[];
    error: undefined;
};

type EnhetNrToOfficeInfoMap = { [enhetNr: string]: OfficeInfo };

export const loadOfficeInfo = async () => {
    console.log('Loading office info from XP');

    const officeInfo = await fetchJson<XpOfficeInfoResponse>(
        urls.xpOfficeInfoApi
    );

    if (officeInfo?.error || !officeInfo?.offices) {
        console.error('Failed to load office urls, retrying in 10 minutes');
        cache.ttl(cacheKey, tenMinutes);
        return;
    }

    const enhetNrToOfficeInfoMap = officeInfo.offices.reduce(
        (acc, office) => ({
            ...acc,
            [office.enhetNr]: office,
        }),
        {}
    );

    cache.set(cacheKey, enhetNrToOfficeInfoMap, oneHour);
};

export const getOfficeInfo = (enhetNr: string) => {
    return cache.get<EnhetNrToOfficeInfoMap>(cacheKey)?.[enhetNr];
};
