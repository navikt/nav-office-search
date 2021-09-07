import { Bydel } from '../types/bydel';
import { PostnrDataOld, PostnrKategori } from '../types/postnr';
import { normalizeString, removeDuplicates } from '../utils';
import { fetchOfficeInfoByGeoId } from '../api/fetch/office-info';
import { kommunenrToBydelerMap, loadBydelerData } from './bydeler';
import { fetchTpsAdresseSok } from '../api/fetch/postnr';
import { getPostnrRegister } from './postnrRegister';
import { OfficeInfo } from '../types/searchResult';

export type KommuneData = {
    kommunenr: string;
    kommuneNavn: string;
    kommuneNavnNormalized: string;
    officeInfo?: OfficeInfo;
    bydeler?: Bydel[];
};

type KommunerMap = { [kommunenr: string]: KommuneData };

export type PostnrData = {
    postnr: string;
    poststed: string;
    poststedNormalized: string;
    kommuneNavn: string;
    kategori: PostnrKategori;
    officeInfo: OfficeInfo[];
};

type PostnrMap = { [postnr: string]: PostnrData };

type OfficeDataMaps = {
    kommuner: KommunerMap;
    postnr: PostnrMap;
};

const data: OfficeDataMaps = {
    kommuner: {},
    postnr: {},
};

export const getKommunerMap = () => data.kommuner;

export const getPostnrMap = () => data.postnr;

export const getPostnrData = (postnr: string) => data.postnr[postnr];

const populateKommunerMap = async (postnrRegister: PostnrDataOld[]) => {
    const uniqueKommuneItems = removeDuplicates(
        postnrRegister,
        (a, b) => a.kommunenr === b.kommunenr
    );

    const newKommunerMap: KommunerMap = {};

    for (const item of uniqueKommuneItems) {
        const { kommunenr, kommune } = item;

        const bydeler = kommunenrToBydelerMap[kommunenr];

        const kommuneDataPartial = {
            kommunenr,
            kommuneNavn: kommune,
            kommuneNavnNormalized: normalizeString(kommune),
        };

        if (bydeler) {
            newKommunerMap[kommunenr] = {
                ...kommuneDataPartial,
                bydeler,
            };
        } else {
            const officeInfo = await fetchOfficeInfoByGeoId(kommunenr);
            if (!officeInfo.error) {
                newKommunerMap[kommunenr] = {
                    ...kommuneDataPartial,
                    officeInfo,
                };
            }
        }
    }

    data.kommuner = newKommunerMap;
};

const populatePostnrMap = async (postnrRegister: PostnrDataOld[]) => {
    const newPostnrMap: PostnrMap = {};

    for (const item of postnrRegister) {
        const { postnr, poststed, kommunenr, kategori, kommune } = item;

        const kommuneData = data.kommuner[kommunenr];

        if (!kommuneData) {
            console.error(`No kommune found for kommunenr ${kommunenr}`);
            continue;
        }

        const postNrDataPartial = {
            postnr,
            poststed,
            poststedNormalized: normalizeString(poststed),
            kommuneNavn: kommune,
            kategori,
        };

        if (kommuneData.bydeler) {
            const result = await fetchTpsAdresseSok(postnr);
            if (!result.error) {
                newPostnrMap[postnr] = {
                    ...postNrDataPartial,
                    officeInfo: result.hits,
                };
            }
        } else if (kommuneData.officeInfo) {
            newPostnrMap[postnr] = {
                ...postNrDataPartial,
                officeInfo: [kommuneData.officeInfo],
            };
        }
    }

    data.postnr = newPostnrMap;
};

let isLoaded = false;
let isLoading = false;

export const loadData = async (callbackOnFinish?: () => void) => {
    if (!isLoading) {
        isLoading = true;
        console.log('started loading data');
        loadBydelerData(async () => {
            const postnrRegister = await getPostnrRegister();
            await populateKommunerMap(postnrRegister);
            await populatePostnrMap(postnrRegister);
            isLoading = false;
            isLoaded = true;
            callbackOnFinish?.();
        });
    }
};

export const isDataLoaded = () => isLoaded;
