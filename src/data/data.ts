import { Bydel } from '../types/bydel';
import { PostnrRegisterData, PostnrKategori } from '../types/postnr';
import { normalizeString, removeDuplicates } from '../utils';
import { fetchOfficeInfoByGeoId } from '../api/fetch/office-info';
import { loadBydelerData } from './bydeler';
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

export type KommunerMap = { [kommunenr: string]: KommuneData };

export type PostnrData = {
    postnr: string;
    poststed: string;
    poststedNormalized: string;
    kommuneNavn: string;
    kategori: PostnrKategori;
    officeInfo?: OfficeInfo[];
};

type PostnrMap = { [postnr: string]: PostnrData };

export type BydelerData = {
    bydelsnr: string;
    navn: string;
    navnNormalized: string;
    officeInfo: OfficeInfo;
};

type BydelerMap = { [bydelnr: string]: BydelerData };
type BydelerByKommunenrMap = { [kommunenr: string]: BydelerData[] };

type OfficeDataMaps = {
    kommuner: KommunerMap;
    postnr: PostnrMap;
    bydeler: BydelerMap;
    bydelerByKommunenr: BydelerByKommunenrMap;
};

const data: OfficeDataMaps = {
    kommuner: {},
    postnr: {},
    bydeler: {},
    bydelerByKommunenr: {},
};

export const getKommunerMap = () => data.kommuner;

export const getPostnrMap = () => data.postnr;

export const getBydelerMap = () => data.bydeler;

export const getPostnrData = async (
    postnr: string
): Promise<PostnrData | null> => {
    const localData = data.postnr[postnr];

    if (!localData) {
        return null;
    }

    if (localData.officeInfo) {
        return localData;
    }

    const fetchedData = await fetchTpsAdresseSok(postnr);

    if (!fetchedData.error) {
        return { ...localData, officeInfo: fetchedData.hits };
    }

    return null;
};

const populateKommunerMap = async (postnrRegister: PostnrRegisterData[]) => {
    const uniqueKommuneItems = removeDuplicates(
        postnrRegister,
        (a, b) => a.kommunenr === b.kommunenr
    );

    const newKommunerMap: KommunerMap = {};

    for (const item of uniqueKommuneItems) {
        const { kommunenr, kommune } = item;

        const bydeler = data.bydelerByKommunenr[kommunenr];

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

const populatePostnrMap = async (postnrRegister: PostnrRegisterData[]) => {
    const newPostnrMap: PostnrMap = {};

    for (const item of postnrRegister) {
        const { postnr, poststed, kommunenr, kategori, kommune } = item;

        const kommuneData = data.kommuner[kommunenr];

        if (!kommuneData) {
            continue;
        }

        const postNrDataPartial = {
            postnr,
            poststed,
            poststedNormalized: normalizeString(poststed),
            kommuneNavn: kommune,
            kategori,
        };

        // if (kommuneData.bydeler) {
        //     if (
        //         kategori === PostnrKategori.Postbokser ||
        //         kategori === PostnrKategori.Servicepostnummer
        //     ) {
        //         newPostnrMap[postnr] = {
        //             ...postNrDataPartial,
        //             officeInfo: kommuneData.bydeler.map(
        //                 (bydel) => bydel.officeInfo
        //             ),
        //         };
        //     } else {
        //         const adresseSokResult = await fetchTpsAdresseSok(postnr);
        //         if (adresseSokResult.error) {
        //             newPostnrMap[postnr] = {
        //                 ...postNrDataPartial,
        //                 officeInfo: kommuneData.bydeler.map(
        //                     (bydel) => bydel.officeInfo
        //                 ),
        //             };
        //         } else {
        //             newPostnrMap[postnr] = {
        //                 ...postNrDataPartial,
        //                 officeInfo: adresseSokResult.hits,
        //             };
        //         }
        //     }
        // } else

        if (kommuneData.officeInfo) {
            newPostnrMap[postnr] = {
                ...postNrDataPartial,
                officeInfo: [kommuneData.officeInfo],
            };
        }
    }

    data.postnr = newPostnrMap;
};

const populateBydelerMap = async () => {
    const bydelerCsvData = await loadBydelerData();

    const newBydelerMap: BydelerMap = {};
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

    data.bydeler = newBydelerMap;
    data.bydelerByKommunenr = newBydelerByKommunenr;
};

let isLoaded = false;
let isLoading = false;

export const loadData = async () => {
    if (!isLoading) {
        console.log('started loading data');
        isLoading = true;
        await populateBydelerMap();
        const postnrRegister = await getPostnrRegister();
        await populateKommunerMap(postnrRegister);
        await populatePostnrMap(postnrRegister);
        isLoading = false;
        isLoaded = true;
    }
};

export const isDataLoaded = () => isLoaded;
