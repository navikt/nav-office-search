import { PostnrRegisterData, PostnrKategori } from '../../types/postnr';
import { normalizeString } from '../../utils/normalizeString';
import { loadBydelerData } from './bydeler';
import { fetchTpsAdresseSok } from '../fetch/postnr';
import { getPostnrRegister } from './postnrRegister';
import { OfficeInfo } from '../../types/searchResult';
import { loadOfficeUrls } from './officeUrls';
import { officeInfoFromAdresseSokResponse, sortOfficeNames } from '../utils';
import { getKommune, loadKommuneData } from './kommuner';

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

type OfficeDataMaps = {
    postnr: PostnrMap;
};

const data: OfficeDataMaps = {
    postnr: {},
};

export const getPostnrArray = () => Object.values(data.postnr);

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
const populatePostnrMap = async (postnrRegister: PostnrRegisterData[]) => {
    const newPostnrMap: PostnrMap = {};

    for (const item of postnrRegister) {
        const { postnr, poststed, kommunenr, kategori, kommune } = item;

        const kommuneData = getKommune(kommunenr);

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

let isLoaded = false;
let isLoading = false;

export const loadData = async () => {
    if (!isLoading) {
        console.log('started loading data');
        isLoading = true;
        await loadOfficeUrls();
        await loadBydelerData();
        const postnrRegister = await getPostnrRegister();
        await loadKommuneData(postnrRegister);
        await populatePostnrMap(postnrRegister);
        isLoading = false;
        isLoaded = true;
    }
};

export const isDataLoaded = () => isLoaded;
