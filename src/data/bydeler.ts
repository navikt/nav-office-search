import fs from 'fs';
import csv from 'csv-parser';
import { normalizeString } from '../utils';
import { Bydel } from '../types/bydel';

type BydelerMap = { [kommunenr: string]: Bydel[] };

export const bydelerData: Bydel[] = [];

export const kommunenrToBydelerMap: BydelerMap = {};

export const getBydelerData = (): Bydel[] => bydelerData;

export const loadBydelerData = (onFinish: () => void) => {
    fs.createReadStream('./rawdata/bydeler.csv', { encoding: 'latin1' })
        .pipe(csv({ separator: ';' }))
        .on('data', (data) => {
            if (data.name !== 'Uoppgitt') {
                const bydel = {
                    bydelsnr: data.code,
                    navn: data.name,
                    navnNormalized: normalizeString(data.name),
                };

                const kommunenr = data.code.substr(0, 4);
                if (!kommunenrToBydelerMap[kommunenr]) {
                    kommunenrToBydelerMap[kommunenr] = [];
                }

                bydelerData.push(bydel);
                kommunenrToBydelerMap[kommunenr].push(bydel);
            }
        })
        .on('end', () => {
            console.log('Loaded data for bydeler');
            onFinish();
        });
};
