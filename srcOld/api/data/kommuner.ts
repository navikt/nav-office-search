import { getBydelerForKommune } from './bydeler';
import { Kommune } from '../../types/data';
import { removeDuplicates } from '../../utils/removeDuplicates';
import { normalizeString } from '../../utils/normalizeString';
import { fetchOfficeInfoByGeoId } from '../fetch/office-info';
import { PostnrRegisterItem } from './postnrRegister';

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
// These are served by NAV Tromsø (5401)
const kommunenrExceptionsMap: { [key: string]: string } = {
    '2100': '5401',
    '2211': '5401',
};

export const getKommunerArray = () => kommunerData.kommunerArray;

export const getKommune = (kommunenr: string) =>
    kommunerData.kommunerMap[kommunenr];

export const loadKommuneData = async (postnrRegister: PostnrRegisterItem[]) => {
    console.log('Loading data for kommuner...');

    const uniqueKommuneItems = removeDuplicates(
        postnrRegister,
        (a, b) => a.kommunenr === b.kommunenr
    );

    const newMap: KommunerMap = {};

    for (const item of uniqueKommuneItems) {
        const { kommunenr, kommune } = item;

        const bydeler = getBydelerForKommune(kommunenr);

        const kommuneDataPartial = {
            kommunenr,
            kommuneNavn: kommune,
            kommuneNavnNormalized: normalizeString(kommune),
        };

        if (bydeler) {
            newMap[kommunenr] = {
                ...kommuneDataPartial,
                bydeler,
            };
        } else {
            const officeInfo = await fetchOfficeInfoByGeoId(
                kommunenrExceptionsMap[kommunenr] || kommunenr
            );

            if (!officeInfo.error) {
                newMap[kommunenr] = {
                    ...kommuneDataPartial,
                    officeInfo,
                };
            }
        }
    }

    const newArray = Object.values(newMap);

    kommunerData.kommunerMap = newMap;
    kommunerData.kommunerArray = newArray;

    console.log(
        `Finished loading data for kommuner! (${newArray.length} entries)`
    );
};
