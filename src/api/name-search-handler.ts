import { getPostnrRegister } from '../data/postnrRegister';
import { getBydelerData } from '../data/bydeler';
import { normalizeString, removeDuplicates } from '../utils';
import {
    NameHit,
    OfficeInfo,
    SearchResultErrorProps,
    SearchResultNameProps,
} from '../types/searchResult';
import { NextApiRequest, NextApiResponse } from 'next';
import { fetchOfficeInfoByGeoId } from './fetch/office-info';
import { fetchTpsAdresseSok } from './fetch/postnr';
import { PostnrKategori } from '../types/postnr';

const findBydeler = async (normalizedQuery: string): Promise<OfficeInfo[]> => {
    const bydelerMatches = getBydelerData().filter((bydel) =>
        bydel.navnNormalized.includes(normalizedQuery)
    );

    return bydelerMatches.map((bydel) => bydel.officeInfo);
};

// TODO: optimaliser! (og cache)
const findPoststeder = async (
    normalizedQuery: string
): Promise<OfficeInfo[]> => {
    const results: OfficeInfo[] = [];

    const postnrRegister = await getPostnrRegister();

    const poststedMatches = removeDuplicates(
        postnrRegister.filter(
            (item) =>
                item.kategori !== PostnrKategori.Postbokser &&
                item.kategori !== PostnrKategori.Servicepostnummer &&
                item.poststedNormalized.includes(normalizedQuery)
        ),
        (a, b) => a.kommunenr === b.kommunenr && !a.bydeler && !b.bydeler
    );

    const kommuneMatches = removeDuplicates(
        postnrRegister.filter((item) =>
            normalizeString(item.kommune).includes(normalizedQuery)
        ),
        (a, b) => a.kommunenr === b.kommunenr
    );

    for (const postnrData of poststedMatches) {
        const officeInfo = await fetchTpsAdresseSok(postnrData.postnr);

        if (officeInfo && !officeInfo.error) {
            results.push(
                ...officeInfo.hits.map((hit) => ({
                    ...hit,
                    adressenavn: postnrData.poststed,
                }))
            );
        }
    }

    for (const kommuneData of kommuneMatches) {
        if (kommuneData.bydeler) {
            for (const bydel of kommuneData.bydeler) {
                const officeInfo = await fetchOfficeInfoByGeoId(bydel.bydelsnr);

                if (officeInfo && !officeInfo.error) {
                    results.push({
                        ...officeInfo,
                        adressenavn: kommuneData.kommune,
                    });
                }
            }
        } else {
            const officeInfo = await fetchOfficeInfoByGeoId(
                kommuneData.kommunenr
            );

            if (officeInfo && !officeInfo.error) {
                results.push({
                    ...officeInfo,
                    adressenavn: kommuneData.kommune,
                });
            }
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
    officeHits: OfficeInfo[],
    normalizedQuery: string
): Promise<NameHit[]> => {
    const hitsMap: { [name: string]: OfficeInfo[] } = {};

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

export const nameSearchHandler = async (
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
