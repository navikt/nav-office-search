import { fetchTpsAdresseSok } from '../fetch/postnr';
import { officeInfoFromAdresseSokResponse, sortOfficeNames } from '../utils';
import { PostnrKategori, PostnrRegisterData } from '../../types/postnr';
import { getKommune } from './kommuner';
import { normalizeString } from '../../utils/normalizeString';
import { OfficeInfo } from '../../types/searchResult';

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

let poststeder: PostnrMap = {};

export const getPostnrArray = () => Object.values(poststeder);

export const getPostnrData = async (
    postnr: string
): Promise<PostnrData | null> => {
    const localData = poststeder[postnr];

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

export const loadPoststedData = async (
    postnrRegister: PostnrRegisterData[]
) => {
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

    poststeder = newPostnrMap;
};
