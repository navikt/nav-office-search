import fs from 'fs';
import csv from 'csv-parser';
import Cache from 'node-cache';
import { fetchOfficeInfoByGeoId } from '../fetch/office-info';
import { normalizeString } from '../../utils/normalizeString';
import { Bydel } from '../../types/data';

const cacheKey = 'bydeler';

const cache = new Cache({
    stdTTL: 3600,
    deleteOnExpire: false,
});

cache.on('expired', () => {
    loadBydelerData();
});

const getBydelerData = () => cache.get<BydelerData>(cacheKey);

type BydelCsvData = {
    code: string;
    name: string;
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

const populateBydelerCache = async (bydelerCsvData: BydelCsvData[]) => {
    const newBydelerMap: BydelerByBydelsnrMap = {};
    const newBydelerByKommunenr: BydelerByKommunenrMap = {};

    for (const item of bydelerCsvData) {
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

            if (!newBydelerByKommunenr[kommunenr]) {
                newBydelerByKommunenr[kommunenr] = [];
            }

            newBydelerByKommunenr[kommunenr].push(bydel);
        }
    }

    cache.set<BydelerData>(cacheKey, {
        bydelerByBydelsnr: newBydelerMap,
        bydelerByKommunenr: newBydelerByKommunenr,
        bydelerArray: Object.values(newBydelerMap),
    });
};

export const loadBydelerData = async () => {
    const dataFromCsv = (await new Promise((res, rej) => {
        const acc: BydelCsvData[] = [];

        fs.createReadStream('./rawdata/bydeler.csv', { encoding: 'latin1' })
            .pipe(csv({ separator: ';' }))
            .on('data', (data: BydelCsvData) => {
                if (data.name !== 'Uoppgitt') {
                    acc.push(data);
                }
            })
            .on('end', () => {
                res(acc);
            })
            .on('error', rej);
    })) as BydelCsvData[];

    await populateBydelerCache(dataFromCsv);
};
