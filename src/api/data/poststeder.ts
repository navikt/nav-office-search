import Cache from 'node-cache';
import {
    fetchTpsAdresseSok,
    officeInfoFromAdresseSokResponse,
} from '../fetch/postnr';
import { sortOfficeNames } from '../utils';
import { Poststed } from '../../types/data';
import { getKommune, loadKommuneData } from './kommuner';
import { normalizeString } from '../../utils/normalizeString';
import { getPostnrRegister, PostnrRegisterData } from './postnrRegister';

const cacheKey = 'poststeder';

const cache = new Cache({
    stdTTL: 3600,
    deleteOnExpire: false,
});

cache.on('expired', async () => {
    const postnrRegister = await getPostnrRegister();
    loadKommuneData(postnrRegister);
});

const getPoststederData = () => cache.get<PoststederData>(cacheKey);

type PoststederMap = { [postnr: string]: Poststed };

type PoststederData = {
    poststederMap: PoststederMap;
    poststederArray: Poststed[];
};

export const getPoststedArray = () =>
    getPoststederData()?.poststederArray || [];

export const getPoststed = async (postnr: string): Promise<Poststed | null> => {
    const localData = getPoststederData()?.poststederMap[postnr];

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

export const loadPoststederData = async (
    postnrRegister: PostnrRegisterData[]
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

    cache.set<PoststederData>(cacheKey, {
        poststederMap: newMap,
        poststederArray: newArray,
    });

    console.log(
        `Finished loading data for poststeder! (${newArray.length} entries)`
    );
};
