import { fetchOfficeInfoByGeoId } from '../api/fetch/officeInfo';
import { Bydel } from '../../../src-common/types/data';
import { normalizeString } from '../../../src-common/normalizeString';
import { fetchJson } from '../api/utils/fetch-utils';
import { urls } from '../../../src-common/urls';

import fallbackData from '../_mock/data/bydeler.json';

const invalidName = 'Uoppgitt';

type SSB_BydelData = {
    code: string;
    name: string;
};

type SSB_ClassificationResponse = {
    error: undefined;
    versions: {
        _links: { self: { href: string } };
        validFrom: string;
        validTo: string;
    }[];
};

type SSB_VersionResponse = {
    error: undefined;
    classificationItems: SSB_BydelData[];
};

type BydelerByBydelsnrMap = { [bydelnr: string]: Bydel };

type BydelerByKommunenrMap = { [kommunenr: string]: Bydel[] };

type BydelerData = {
    bydelerByBydelsnr: BydelerByBydelsnrMap;
    bydelerByKommunenr: BydelerByKommunenrMap;
    bydelerArray: Bydel[];
};

const bydelerData: BydelerData = {
    bydelerByBydelsnr: {},
    bydelerByKommunenr: {},
    bydelerArray: [],
};

export const getBydelerArray = () => bydelerData.bydelerArray;

export const getBydel = (bydelnr: string) =>
    bydelerData.bydelerByBydelsnr[bydelnr];

export const getBydelerForKommune = (kommunenr: string) =>
    bydelerData.bydelerByKommunenr[kommunenr];

const populateBydelerCache = async (bydelerDataRaw: SSB_BydelData[]) => {
    const newBydelerMap: BydelerByBydelsnrMap = {};
    const newBydelerByKommunenrMap: BydelerByKommunenrMap = {};

    for (const item of bydelerDataRaw) {
        const { code: bydelsnr, name } = item;

        if (name === invalidName) {
            continue;
        }

        const officeInfo = await fetchOfficeInfoByGeoId(bydelsnr);

        if (!officeInfo.error) {
            const bydel = {
                bydelsnr,
                navn: name,
                navnNormalized: normalizeString(name),
                officeInfo,
            };

            newBydelerMap[bydelsnr] = bydel;

            const kommunenr = bydelsnr.substr(0, 4);

            if (!newBydelerByKommunenrMap[kommunenr]) {
                newBydelerByKommunenrMap[kommunenr] = [];
            }

            newBydelerByKommunenrMap[kommunenr].push(bydel);
        }
    }

    const newArray = Object.values(newBydelerMap);

    bydelerData.bydelerByBydelsnr = newBydelerMap;
    bydelerData.bydelerByKommunenr = newBydelerByKommunenrMap;
    bydelerData.bydelerArray = newArray;

    console.log(
        `Finished loading data for bydeler! (${newArray.length} entries)`
    );
};

const fetchBydelerRawData = async () => {
    const bydelerClassification = await fetchJson<SSB_ClassificationResponse>(
        urls.ssbBydelerClassification
    );

    if (bydelerClassification.error) {
        console.error(
            `Error while fetching SSB classification for bydeler - ${bydelerClassification.message}`
        );
        return null;
    }

    const now = new Date();

    const currentVersion = bydelerClassification.versions.find((version) => {
        const validTo = version.validTo && new Date(version.validTo);
        const validFrom = version.validFrom && new Date(version.validFrom);

        return now >= validFrom && (!validTo || now <= validTo);
    });

    const currentVersionUrl = currentVersion?._links?.self?.href;

    if (!currentVersionUrl) {
        console.error('Could not find valid version for bydeler from SSB');
        return null;
    }

    const currentBydelerVersion = await fetchJson<SSB_VersionResponse>(
        currentVersionUrl
    );

    if (currentBydelerVersion.error) {
        console.error(
            `Error while fetching current bydeler version - ${currentBydelerVersion.message}`
        );
        return null;
    }

    return currentBydelerVersion.classificationItems;
};

export const loadBydelerData = async () => {
    console.log('Loading data for bydeler...');

    const bydelerRawData = await fetchBydelerRawData();

    if (bydelerRawData) {
        await populateBydelerCache(bydelerRawData);
    } else {
        if (bydelerData.bydelerArray.length === 0) {
            console.error(
                'Failed to load bydeler from SSB - falling back to local data'
            );
            await populateBydelerCache(fallbackData);
        } else {
            console.error(
                'Failed to load bydeler from SSB - keeping current data for this cycle'
            );
        }
    }
};
