import fs from 'fs';
import csv from 'csv-parser';
import { OfficeInfo } from '../../types/searchResult';
import { fetchOfficeInfoByGeoId } from '../fetch/office-info';
import { normalizeString } from '../../utils/normalizeString';

type BydelCsvData = {
    code: string;
    name: string;
};

export type BydelData = {
    bydelsnr: string;
    navn: string;
    navnNormalized: string;
    officeInfo: OfficeInfo;
};

type BydelerByBydelsnrMap = { [bydelnr: string]: BydelData };

type BydelerByKommunenrMap = { [kommunenr: string]: BydelData[] };

let bydelerByBydelsnr: BydelerByBydelsnrMap = {};

let bydelerByKommunenr: BydelerByKommunenrMap = {};

export const getBydelerArray = () => Object.values(bydelerByBydelsnr);

export const getBydel = (bydelnr: string) => bydelerByBydelsnr[bydelnr];

export const getBydelerForKommune = (kommunenr: string) =>
    bydelerByKommunenr[kommunenr];

const populateBydelerMap = async (bydelerCsvData: BydelCsvData[]) => {
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

    bydelerByBydelsnr = newBydelerMap;
    bydelerByKommunenr = newBydelerByKommunenr;
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

    await populateBydelerMap(dataFromCsv);
};
