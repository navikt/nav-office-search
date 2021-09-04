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
                const officeInfo = await fetchOfficeInfoByGeoId(data.code);

                if (officeInfo.error) {
                    console.error(
                        `Failed to load office info for bydelnr ${data.code} - ${officeInfo.message}`
                    );
                    return;
                }

                const bydel: Bydel = {
                    bydelsnr: data.code,
                    navn: data.name,
                    navnNormalized: normalizeString(data.name),
                    officeInfo: officeInfo,
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
