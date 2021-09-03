import { getPostnrRegister } from '../data/postnrRegister';
import { getBydelerData } from '../data/bydeler';
import { normalizeString, removeDuplicates } from '../utils';
import {
    NameHit,
    OfficeHitProps,
    SearchResultErrorProps,
    SearchResultNameProps,
} from '../types/searchResult';
import { NextApiRequest, NextApiResponse } from 'next';
import { fetchOfficeInfoByGeoId } from './fetch/office-info';
import { fetchTpsAdresseSok } from './fetch/postnr';

const findBydeler = async (
    normalizedQuery: string
): Promise<OfficeHitProps[]> => {
    const bydelerMatches = getBydelerData().filter((bydel) =>
        bydel.navnNormalized.includes(normalizedQuery)
    );

    const results: OfficeHitProps[] = [];

    for (const bydelData of bydelerMatches) {
        const officeInfo = await fetchOfficeInfoByGeoId(bydelData.bydelsnr);

        if (officeInfo && !officeInfo.error) {
            results.push(officeInfo);
        }
    }

    return results;
};

const findPoststeder = async (
    normalizedQuery: string
): Promise<OfficeHitProps[]> => {
    const results: OfficeHitProps[] = [];

    const postnrMatches = (await getPostnrRegister()).filter((item) =>
        item.poststedNormalized.includes(normalizedQuery)
    );

    for (const postnrData of postnrMatches) {
        const officeInfo = await fetchTpsAdresseSok(postnrData.postnr);

        if (officeInfo && !officeInfo.error) {
            results.push(...officeInfo.hits);
        }
    }

    return results;
};

const sortNamesWithQueryFirstBias =
    (queryNormalized: string) => (a: NameHit, b: NameHit) => {
        const aStartsWithInput = normalizeString(a.name).startsWith(
            queryNormalized
        );
        const bStartsWithInput = normalizeString(b.name).startsWith(
            queryNormalized
        );

        if (aStartsWithInput && !bStartsWithInput) {
            return -1;
        }

        if (!aStartsWithInput && bStartsWithInput) {
            return 1;
        }

        return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
    };

const transformHits = async (
    officeHits: OfficeHitProps[],
    normalizedQuery: string
): Promise<NameHit[]> => {
    const hitsMap: { [name: string]: OfficeHitProps[] } = {};

    for (const officeHit of officeHits) {
        const name = officeHit.adressenavn;
        if (!hitsMap[name]) {
            hitsMap[name] = [];
        }

        hitsMap[name].push(officeHit);
    }

    return Object.entries(hitsMap)
        .map(([name, hits]) => ({
            name: name,
            officeHits: removeDuplicates(
                hits,
                (a, b) => a.enhetNr === b.enhetNr
            ).sort((a, b) => (a.kontorNavn > b.kontorNavn ? 1 : -1)),
        }))
        .sort(sortNamesWithQueryFirstBias(normalizedQuery));
};

export const responseFromNameSearch = async (
    req: NextApiRequest,
    res: NextApiResponse<SearchResultNameProps | SearchResultErrorProps>
) => {
    const query = req.query.query as string;

    const normalizedQuery = normalizeString(query);

    const poststederHits = await findPoststeder(normalizedQuery);

    const bydelerHits = await findBydeler(normalizedQuery);

    const allHits = await transformHits(
        [...poststederHits, ...bydelerHits],
        normalizedQuery
    );

    return res
        .status(200)
        .send({ nameHits: allHits, type: 'name', input: query });
};
