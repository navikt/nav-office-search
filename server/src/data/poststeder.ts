import {
    fetchTpsAdresseSok,
    officeInfoFromAdresseSokResponse,
} from '../api/fetch/postnr';
import { getKommune } from './kommuner';
import { PostnrRegisterItem } from './postnrRegister';
import { Poststed } from '../../../common/types/data';
import { normalizeString } from '../../../common/normalizeString';
import { sortOfficeNames } from '../utils/sort';

type PoststederMap = { [postnr: string]: Poststed };

type PoststederData = {
    poststederMap: PoststederMap;
    poststederArray: Poststed[];
};

const poststederData: PoststederData = {
    poststederMap: {},
    poststederArray: [],
};

export const getPoststedArray = () => poststederData.poststederArray;

export const getPoststed = async (postnr: string): Promise<Poststed | null> => {
    const localData = poststederData.poststederMap[postnr];

    if (!localData) {
        return null;
    }

    if (localData.officeInfo.length > 0) {
        return localData;
    }

    const adresseSokResponse = await fetchTpsAdresseSok(postnr);

    if (!adresseSokResponse.error) {
        const officeInfo = officeInfoFromAdresseSokResponse(adresseSokResponse);
        return { ...localData, officeInfo };
    }

    return localData;
};

export const loadPoststederData = async (
    postnrRegister: PostnrRegisterItem[]
) => {
    console.log('Loading data for poststeder...');

    const newMap: PoststederMap = {};

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

        newMap[postnr] = {
            ...postNrDataPartial,
            officeInfo: officeInfo.sort(sortOfficeNames),
        };
    }

    const newArray = Object.values(newMap);

    poststederData.poststederMap = newMap;
    poststederData.poststederArray = newArray;

    console.log(
        `Finished loading data for poststeder! (${newArray.length} entries)`
    );
};
