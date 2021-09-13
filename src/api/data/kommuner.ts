import { OfficeInfo } from '../../types/searchResult';
import { BydelData, getBydelerForKommune } from './bydeler';
import { PostnrRegisterData } from '../../types/postnr';
import { removeDuplicates } from '../../utils/removeDuplicates';
import { normalizeString } from '../../utils/normalizeString';
import { fetchOfficeInfoByGeoId } from '../fetch/office-info';

export type KommuneData = {
    kommunenr: string;
    kommuneNavn: string;
    kommuneNavnNormalized: string;
    officeInfo?: OfficeInfo;
    bydeler?: BydelData[];
};

export type KommunerMap = { [kommunenr: string]: KommuneData };

let kommuner: KommunerMap = {};

// Svalbard (2100) and Jan Mayen (2211) do not have their own offices
// These are served by NAV Tromsø (5401)
const kommunenrExceptionsMap: { [key: string]: string } = {
    '2100': '5401',
    '2211': '5401',
};

export const getKommunerArray = () => Object.values(kommuner);

export const getKommune = (kommunenr: string) => kommuner[kommunenr];

export const loadKommuneData = async (postnrRegister: PostnrRegisterData[]) => {
    const uniqueKommuneItems = removeDuplicates(
        postnrRegister,
        (a, b) => a.kommunenr === b.kommunenr
    );

    const newKommunerMap: KommunerMap = {};

    for (const item of uniqueKommuneItems) {
        const { kommunenr, kommune } = item;

        const bydeler = getBydelerForKommune(kommunenr);

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

    kommuner = newKommunerMap;
};
