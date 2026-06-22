import { getBydelerForKommune } from './bydeler';
import { removeDuplicates } from '../utils/removeDuplicates';
import { fetchOfficeInfoByGeoId } from '../external/officeInfo';
import { PostnrRegisterItem } from './postnrRegister';
import { Kommune } from '../../../common/types/data';
import { normalizeString } from '../../../common/normalizeString';

type KommunerMap = { [kommunenr: string]: Kommune };

type KommunerData = {
    kommunerMap: KommunerMap;
    kommunerArray: Kommune[];
};

const kommunerData: KommunerData = {
    kommunerMap: {},
    kommunerArray: [],
};

// Svalbard (2100) and Jan Mayen (2211) do not have their own offices
// These are served by Nav Tromsø (5401)
const kommunenrExceptionsMap: { [key: string]: string } = {
    '2100': '5401',
    '2211': '5401',
};

export const getOfficeInfoGeoIdForKommune = (kommunenr: string) =>
    kommunenrExceptionsMap[kommunenr] || kommunenr;

export const getKommunerArray = () => kommunerData.kommunerArray;

export const getKommune = (kommunenr: string) => kommunerData.kommunerMap[kommunenr];

// Takes all kommuner (from postnummerregister), and one by one
// fetch the Nav-kontor from NORG via nav-office-search-api). This is the geoId endpoint
// If the kommune has bydeler, we skip the office info fetch.
export const buildKommuneDictionary = async (postnrRegister: PostnrRegisterItem[]) => {
    console.log('Building kommune dictionary by loading offices one by one');

    const uniqueKommuneItems = removeDuplicates(
        postnrRegister,
        (a, b) => a.kommunenr === b.kommunenr
    );

    const kommuneMap: KommunerMap = {};

    for (const item of uniqueKommuneItems) {
        const { kommunenr, kommune } = item;

        const bydeler = getBydelerForKommune(kommunenr);

        const kommuneDataPartial = {
            kommunenr,
            kommuneNavn: kommune,
            kommuneNavnNormalized: normalizeString(kommune),
        };

        if (bydeler) {
            kommuneMap[kommunenr] = {
                ...kommuneDataPartial,
                bydeler,
            };
        } else {
            const officeInfo = await fetchOfficeInfoByGeoId(
                getOfficeInfoGeoIdForKommune(kommunenr)
            );

            if (!officeInfo.error) {
                kommuneMap[kommunenr] = {
                    ...kommuneDataPartial,
                    officeInfo,
                };
            }
        }
    }

    const kommuneArray = Object.values(kommuneMap);

    kommunerData.kommunerMap = kommuneMap;
    kommunerData.kommunerArray = kommuneArray;

    console.log(`Finished loading data for kommuner! (${kommuneArray.length} entries)`);
};
