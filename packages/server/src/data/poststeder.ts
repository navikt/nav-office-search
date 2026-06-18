import { getBydelerForKommune } from './bydeler';
import { getKommune, getOfficeInfoGeoIdForKommune } from './kommuner';
import { PostnrRegisterItem } from './postnrRegister';
import { Poststed } from '../../../common/types/data';
import { normalizeString } from '../../../common/normalizeString';
import { fetchOfficeInfoByGeoId } from '../external/officeInfo';

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

    if (localData.officeInfo.length === 0) {
        if (getBydelerForKommune(localData.kommunenr)) {
            return localData;
        }

        const officeInfo = await fetchOfficeInfoByGeoId(
            getOfficeInfoGeoIdForKommune(localData.kommunenr)
        );

        if (!('error' in officeInfo)) {
            const poststedWithOfficeInfo = {
                ...localData,
                officeInfo: [officeInfo],
            };

            poststederData.poststederMap[postnr] = poststedWithOfficeInfo;

            return poststedWithOfficeInfo;
        }
    }

    return localData;
};

export const loadPoststederData = async (postnrRegister: PostnrRegisterItem[]) => {
    console.log('Loading data for poststeder...');

    const newMap: PoststederMap = {};

    for (const item of postnrRegister) {
        const { postnr, poststed, kommunenr, kategori, kommune } = item;

        const kommuneData = getKommune(kommunenr);

        newMap[postnr] = {
            postnr,
            poststed,
            poststedNormalized: normalizeString(poststed),
            kommuneNavn: kommune,
            kommunenr,
            kategori,
            officeInfo: kommuneData?.officeInfo ? [kommuneData.officeInfo] : [],
        };
    }

    const newArray = Object.values(newMap);

    poststederData.poststederMap = newMap;
    poststederData.poststederArray = newArray;

    console.log(`Finished loading data for poststeder! (${newArray.length} entries)`);
};
