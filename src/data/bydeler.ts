import fs from 'fs';
import csv from 'csv-parser';

type BydelerCsvData = {
    code: string;
    name: string;
};

export const loadBydelerData = async (): Promise<BydelerCsvData[]> =>
    (await new Promise((res, rej) => {
        const acc: BydelerCsvData[] = [];

        fs.createReadStream('./rawdata/bydeler.csv', { encoding: 'latin1' })
            .pipe(csv({ separator: ';' }))
            .on('data', (data: BydelerCsvData) => {
                if (data.name !== 'Uoppgitt') {
                    acc.push(data);
                }
            })
            .on('end', () => {
                res(acc);
            })
            .on('error', rej);
    })) as BydelerCsvData[];
