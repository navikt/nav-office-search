import fs from 'fs';
import csv from 'csv-parser';
import { normalizeString } from '../utils';
import { Bydel } from '../types/bydel';
import { fetchOfficeInfoByGeoId } from '../api/fetch/office-info';

type BydelerMap = { [kommunenr: string]: Bydel[] };

export const bydelerData: Bydel[] = [];

export const kommunenrToBydelerMap: BydelerMap = {};

export const getBydelerData = (): Bydel[] => bydelerData;

export const loadBydelerData = (onFinish: () => void) => {
    fs.createReadStream('./rawdata/bydeler.csv', { encoding: 'latin1' })
        .pipe(csv({ separator: ';' }))
        .on('data', async (data) => {
            if (data.name !== 'Uoppgitt') {
                const bydelsnr = data.code;

                const officeInfo = await fetchOfficeInfoByGeoId(bydelsnr);

                if (!officeInfo.error) {
                    const bydel = {
                        bydelsnr,
                        navn: data.name,
                        navnNormalized: normalizeString(data.name),
                        officeInfo,
                    };

                    const kommunenr = bydelsnr.substr(0, 4);
                    if (!kommunenrToBydelerMap[kommunenr]) {
                        kommunenrToBydelerMap[kommunenr] = [];
                    }

                    bydelerData.push(bydel);
                    kommunenrToBydelerMap[kommunenr].push(bydel);
                }
            }
        })
        .on('end', () => {
            console.log('Loaded data for bydeler');
            onFinish();
        });
};
