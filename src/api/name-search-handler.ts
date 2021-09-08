import { normalizeString, removeDuplicates } from '../utils';
import {
    NameHit,
    OfficeInfo,
    SearchResultErrorProps,
    SearchResultNameProps,
} from '../types/searchResult';
import { NextApiRequest, NextApiResponse } from 'next';
import { getBydelerArray, getKommunerArray, getPostnrArray } from './data/data';

const findBydeler = (normalizedQuery: string): OfficeInfo[] => {
    const bydelerMatches = getBydelerArray().filter((bydel) =>
        bydel.navnNormalized.includes(normalizedQuery)
    );

    return bydelerMatches.map((bydel) => ({
        ...bydel.officeInfo,
        hitString: bydel.navn,
    }));
};

const findPoststeder = (normalizedQuery: string): OfficeInfo[] => {
    const poststedMatches = getPostnrArray().reduce((matches, poststed) => {
        const isMatch =
            poststed.poststedNormalized.includes(normalizedQuery) &&
            poststed.officeInfo.length > 0;
        if (!isMatch) {
            return matches;
        }

        return [
            ...matches,
            ...poststed.officeInfo.map((office) => ({
                ...office,
                hitString: poststed.poststed,
            })),
        ];
    }, [] as OfficeInfo[]);

    return poststedMatches;
};

const findKommuner = (normalizedQuery: string): OfficeInfo[] => {
    const kommuneMatches = getKommunerArray().reduce((matches, kommune) => {
        const isMatch = kommune.kommuneNavnNormalized.includes(normalizedQuery);
        if (!isMatch) {
            return matches;
        }

        const officeInfo = kommune.bydeler
            ? kommune.bydeler.map((bydel) => ({
                  ...bydel.officeInfo,
                  hitString: kommune.kommuneNavn,
              }))
            : kommune.officeInfo
            ? [{ ...kommune.officeInfo, hitString: kommune.kommuneNavn }]
            : [];

        return [...matches, ...officeInfo];
    }, [] as OfficeInfo[]);

    return kommuneMatches;
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

const transformHits = (
    officeHits: OfficeInfo[],
    normalizedQuery: string
): NameHit[] => {
    const hitsMap: { [name: string]: OfficeInfo[] } = {};

    for (const officeHit of officeHits) {
        const name = officeHit.hitString;
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

    const poststederHits = findPoststeder(normalizedQuery);

    const kommunerHits = findKommuner(normalizedQuery);

    const bydelerHits = findBydeler(normalizedQuery);

    return res.status(200).send({
        nameHits: transformHits(
            [...poststederHits, ...kommunerHits, ...bydelerHits],
            normalizedQuery
        ),
        type: 'name',
        input: query,
    });
};
