import { NameHit } from '../../../../../common/types/results';
import { removeDuplicates } from '../../../utils/removeDuplicates';
import { getBydelerArray } from '../../../data/bydeler';
import { getKommunerArray } from '../../../data/kommuner';
import { getPoststedArray } from '../../../data/poststeder';
import { OfficeInfo } from '../../../../../common/types/data';
import { Request, Response } from 'express';
import { normalizeString } from '../../../../../common/normalizeString';
import { norskSort, sortOfficeNames } from '../../../utils/sort';
import { apiErrorResponse } from '../../../utils/fetch';

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
    return getPoststedArray().reduce((matches, poststed) => {
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
};

const findKommuner = (normalizedQuery: string): OfficeInfo[] => {
    return getKommunerArray().reduce((matches, kommune) => {
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

        return norskSort(a.name, b.name);
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
            ).sort(sortOfficeNames),
        }))
        .sort(sortNamesWithQueryFirstBias(normalizedQuery));
};

export const nameSearchHandler = async (req: Request, res: Response) => {
    const { query } = req.query;

    if (typeof query !== 'string') {
        return res.status(400).send(apiErrorResponse('errorInvalidQuery'));
    }

    const normalizedQuery = normalizeString(query);

    const poststederHits = findPoststeder(normalizedQuery);

    const kommunerHits = findKommuner(normalizedQuery);

    const bydelerHits = findBydeler(normalizedQuery);

    return res.status(200).send({
        hits: transformHits(
            [...poststederHits, ...kommunerHits, ...bydelerHits],
            normalizedQuery
        ),
        type: 'name',
        input: query,
    });
};
