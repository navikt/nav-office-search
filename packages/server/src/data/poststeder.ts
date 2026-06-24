import { getBydelerForKommune } from './bydeler';
import { getKommune, getOfficeInfoGeoIdForKommune } from './kommuner';
import { PostnrRegisterItem } from './postnrRegister';
import { Poststed } from '../../../common/types/data';
import { normalizeString } from '../../../common/normalizeString';
import { fetchOfficeInfoByGeoId } from '../external/officeInfo';

type PoststederMap = Map<string, Poststed>;

type PoststederData = {
    poststederMap: PoststederMap;
    poststederArray: Poststed[];
};

const poststederData: PoststederData = {
    poststederMap: new Map(),
    poststederArray: [],
};

export const getPoststedArray = () => poststederData.poststederArray;

export const getPoststed = async (postnr: string): Promise<Poststed | null> => {
    const localData = poststederData.poststederMap.get(postnr);

    // Postnr was not found
    if (!localData) {
        return null;
    }

    // For most postnr, the office info is already mapped (officeInfo)
    // If the postnr is in a kommune with bydeler, we have to
    // make some separate mapping.
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

            poststederData.poststederMap.set(postnr, poststedWithOfficeInfo);

            return poststedWithOfficeInfo;
        }
    }

    return localData;
};

// This function is used at startup and data kept in memory
export const loadPoststederData = async (postnrRegister: PostnrRegisterItem[]) => {
    console.log('Loading data for poststeder...');

    const newPoststederMap: PoststederMap = new Map();

    for (const item of postnrRegister) {
        const { postnr, poststed, kommunenr, kategori, kommune } = item;

        const kommuneData = getKommune(kommunenr);

        newPoststederMap.set(postnr, {
            postnr,
            poststed,
            poststedNormalized: normalizeString(poststed),
            kommuneNavn: kommune,
            kommunenr,
            kategori,
            officeInfo: kommuneData?.officeInfo ? [kommuneData.officeInfo] : [],
        });
    }

    const newPoststederArray = Array.from(newPoststederMap.values());

    poststederData.poststederMap = newPoststederMap;
    poststederData.poststederArray = newPoststederArray;

    console.log(`Finished loading data for poststeder! (${newPoststederArray} entries)`);
};
