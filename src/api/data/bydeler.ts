import Cache from 'node-cache';
import { fetchOfficeInfoByGeoId } from '../fetch/office-info';
import { normalizeString } from '../../utils/normalizeString';
import { Bydel } from '../../types/data';
import { fetchJson } from '../fetch/fetch-json';
import fallbackData from '../../../rawdata/bydeler.json';
import { urls } from '../../urls';

const cacheKey = 'bydeler';

const cache = new Cache({
    stdTTL: 3600,
    deleteOnExpire: false,
});

cache.on('expired', () => {
    loadBydelerData();
});

const getBydelerData = () => cache.get<BydelerData>(cacheKey);

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

export const getBydelerArray = () => getBydelerData()?.bydelerArray || [];

export const getBydel = (bydelnr: string) =>
    getBydelerData()?.bydelerByBydelsnr[bydelnr];

export const getBydelerForKommune = (kommunenr: string) =>
    getBydelerData()?.bydelerByKommunenr[kommunenr];

const populateBydelerCache = async (bydelerData: SSB_BydelData[]) => {
    const newBydelerMap: BydelerByBydelsnrMap = {};
    const newBydelerByKommunenrMap: BydelerByKommunenrMap = {};

    for (const item of bydelerData) {
        const { code: bydelsnr, name } = item;

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

    cache.set<BydelerData>(cacheKey, {
        bydelerByBydelsnr: newBydelerMap,
        bydelerByKommunenr: newBydelerByKommunenrMap,
        bydelerArray: newArray,
    });

    console.log(
        `Finished loading data for bydeler! (${newArray.length} entries)`
    );
};

export const loadBydelerData = async () => {
    console.log('Loading data for bydeler...');

    const bydelerClassification = await fetchJson<SSB_ClassificationResponse>(
        urls.ssbBydelerClassification
    );

    if (!bydelerClassification.error) {
        const now = new Date();

        const currentVersion = bydelerClassification.versions.find(
            (version) => {
                const validTo = version.validTo && new Date(version.validTo);
                const validFrom =
                    version.validFrom && new Date(version.validFrom);

                return now >= validFrom && (!validTo || now <= validTo);
            }
        );

        const currentVersionUrl = currentVersion?._links?.self?.href;

        if (currentVersionUrl) {
            const currentBydelerVersion = await fetchJson<SSB_VersionResponse>(
                currentVersionUrl
            );

            if (!currentBydelerVersion.error) {
                await populateBydelerCache(
                    currentBydelerVersion.classificationItems
                );

                return;
            }
        }
    }

    console.error(
        'Failed to load bydeler from SSB - falling back to local data'
    );

    await populateBydelerCache(fallbackData);
};
