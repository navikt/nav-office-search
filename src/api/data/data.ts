import { PostnrRegisterData, PostnrKategori } from '../../types/postnr';
import { normalizeString, removeDuplicates } from '../../utils/utils';
import { fetchOfficeInfoByGeoId } from '../fetch/office-info';
import { loadBydelerData } from './bydeler';
import { fetchTpsAdresseSok } from '../fetch/postnr';
import { getPostnrRegister } from './postnrRegister';
import { OfficeInfo } from '../../types/searchResult';
import { loadOfficeUrls } from './officeUrls';
import { officeInfoFromAdresseSokResponse, sortOfficeNames } from '../utils';

export type KommuneData = {
    kommunenr: string;
    kommuneNavn: string;
    kommuneNavnNormalized: string;
    officeInfo?: OfficeInfo;
    bydeler?: BydelerData[];
};

export type KommunerMap = { [kommunenr: string]: KommuneData };

export type PostnrData = {
    postnr: string;
    poststed: string;
    poststedNormalized: string;
    kommuneNavn: string;
    kommunenr: string;
    bydelsnr?: string;
    kategori: PostnrKategori;
    officeInfo: OfficeInfo[];
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

// Svalbard (2100) and Jan Mayen (2211) do not have their own offices
// These are served by NAV Tromsø (5401)
const kommunenrExceptionsMap: { [key: string]: string } = {
    '2100': '5401',
    '2211': '5401',
};

export const getKommunerArray = () => Object.values(data.kommuner);

export const getPostnrArray = () => Object.values(data.postnr);

export const getBydelerArray = () => Object.values(data.bydeler);

export const getKommuneData = (kommunenr: string) => data.kommuner[kommunenr];

export const getBydelerData = (bydelnr: string) => data.bydeler[bydelnr];

export const getPostnrData = async (
    postnr: string
): Promise<PostnrData | null> => {
    const localData = data.postnr[postnr];

    if (!localData) {
        return null;
    }

    if (localData.officeInfo.length > 0) {
        return localData;
    }

    const adresseSokResponse = await fetchTpsAdresseSok(postnr);

    if (adresseSokResponse.error) {
        return null;
    }

    const officeInfo = officeInfoFromAdresseSokResponse(adresseSokResponse);

    return { ...localData, officeInfo };
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
            const officeInfo = await fetchOfficeInfoByGeoId(
                kommunenrExceptionsMap[kommunenr] || kommunenr
            );

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
            kommunenr,
            kategori,
        };

        const officeInfo = kommuneData.officeInfo
            ? [kommuneData.officeInfo]
            : [];

        newPostnrMap[postnr] = {
            ...postNrDataPartial,
            officeInfo: officeInfo.sort(sortOfficeNames),
        };
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
        await loadOfficeUrls();
        await populateBydelerMap();
        const postnrRegister = await getPostnrRegister();
        await populateKommunerMap(postnrRegister);
        await populatePostnrMap(postnrRegister);
        isLoading = false;
        isLoaded = true;
    }
};

export const isDataLoaded = () => isLoaded;
