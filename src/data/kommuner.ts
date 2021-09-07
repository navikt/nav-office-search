import { OfficeHitProps } from '../types/searchResult';
import { Bydel } from '../types/bydel';
import { PostnrData } from '../types/postnr';
import { normalizeString, removeDuplicates } from '../utils';
import { fetchOfficeInfoByGeoId } from '../api/fetch/office-info';
import { kommunenrToBydelerMap } from './bydeler';
import { fetchTpsAdresseSok } from '../api/fetch/postnr';
import { getPostnrRegister } from './postnrRegister';

type KommunerMap = {
    [kommunenr: string]: {
        navn: string;
        navnNormalized: string;
        officeInfo?: OfficeHitProps;
        bydeler?: Bydel[];
    };
};

type PostnrMap = {
    [postnr: string]: {
        poststed: string;
        poststedNormalized: string;
        officeInfo: OfficeHitProps[];
    };
};

type OfficeDataMaps = {
    kommuner: KommunerMap;
    postnr: PostnrMap;
};

const data: OfficeDataMaps = {
    kommuner: {},
    postnr: {},
};

export const getKommunerMap = () => data.kommuner;

export const getPostnrMap = () => data.postnr;

const populateKommunerMap = async (postnrRegister: PostnrData[]) => {
    const uniqueKommuneItems = removeDuplicates(
        postnrRegister,
        (a, b) => a.kommunenr === b.kommunenr
    );

    const newKommunerMap: KommunerMap = {};

    for (const item of uniqueKommuneItems) {
        const { kommunenr, kommune } = item;

        const navnNormalized = normalizeString(kommune);

        const bydeler = kommunenrToBydelerMap[kommunenr];

        if (bydeler) {
            newKommunerMap[kommunenr] = {
                navn: kommune,
                navnNormalized,
                bydeler,
            };
        } else {
            const officeInfo = await fetchOfficeInfoByGeoId(kommunenr);
            if (!officeInfo.error) {
                newKommunerMap[kommunenr] = {
                    navn: kommune,
                    navnNormalized,
                    officeInfo,
                };
            }
        }
    }

    console.log(newKommunerMap);

    data.kommuner = newKommunerMap;
};

const populatePostnrMap = async (postnrRegister: PostnrData[]) => {
    const newPostnrMap: PostnrMap = {};

    for (const item of postnrRegister) {
        const { postnr, poststed, kommunenr } = item;

        const poststedNormalized = normalizeString(poststed);

        const kommuneData = data.kommuner[kommunenr];

        if (kommuneData.bydeler) {
            const result = await fetchTpsAdresseSok(postnr);
            if (!result.error) {
                newPostnrMap[postnr] = {
                    poststed,
                    poststedNormalized,
                    officeInfo: result.hits,
                };
            }
        } else if (kommuneData.officeInfo) {
            newPostnrMap[postnr] = {
                poststed,
                poststedNormalized,
                officeInfo: [kommuneData.officeInfo],
            };
        }
    }

    data.postnr = newPostnrMap;
};

export const populateDataMaps = async () => {
    const postnrRegister = await getPostnrRegister();
    await populateKommunerMap(postnrRegister);
    await populatePostnrMap(postnrRegister);
};
