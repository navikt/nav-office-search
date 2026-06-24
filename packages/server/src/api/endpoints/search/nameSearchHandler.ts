import { NameHit } from '../../../../../common/types/results';
import { removeDuplicates } from '../../../utils/removeDuplicates';
import { getBydelerArray } from '../../../data/bydeler';
import { getKommunerArray } from '../../../data/kommuner';
import { getPoststedArray } from '../../../data/poststeder';
import { Kommune, OfficeInfo } from '../../../../../common/types/data';
import { normalizeString } from '../../../../../common/normalizeString';
import { norskSort, sortOfficeNames } from '../../../utils/sort';
import { RequestHandler } from 'express';
import { isDataLoaded, loadData } from '../../../data/data';
import { apiErrorResponse } from '../../../utils/fetch';

const buildOfficeHit = (officeInfo: OfficeInfo, hitString: string): OfficeInfo => ({
    ...officeInfo,
    hitString,
});

const getBydelFromKommune = (kommune: Kommune, normalizedQuery: string) => {
    if (!kommune.bydeler) {
        return [];
    }

    return kommune.bydeler
        .filter((bydel) => {
            return (
                bydel.officeInfo.name.toLowerCase().includes(normalizedQuery) ||
                bydel.navnNormalized.toLowerCase().includes(normalizedQuery)
            );
        })
        .map((bydel) => buildOfficeHit(bydel.officeInfo, bydel.navn));
};

const findOfficeName = (normalizedQuery: string): OfficeInfo[] => {
    // The office names is buried in the kommuner array,
    // so start from there
    let officeHits: OfficeInfo[] = [];
    getKommunerArray().forEach((kommune) => {
        const bydelerOfficeHits = getBydelFromKommune(kommune, normalizedQuery);

        const isMatch = kommune.officeInfo?.name.toLowerCase().includes(normalizedQuery);

        const officeHit =
            kommune.officeInfo && isMatch
                ? buildOfficeHit(kommune.officeInfo, kommune.kommuneNavn)
                : null;

        officeHits = officeHit
            ? [...officeHits, ...bydelerOfficeHits, officeHit]
            : [...officeHits, ...bydelerOfficeHits];
    });

    return officeHits;
};

const findBydeler = (normalizedQuery: string): OfficeInfo[] => {
    const bydelerMatches = getBydelerArray().filter((bydel) =>
        bydel.navnNormalized.includes(normalizedQuery)
    );

    return bydelerMatches.map((bydel) => buildOfficeHit(bydel.officeInfo, bydel.navn));
};

const findPoststeder = (normalizedQuery: string): OfficeInfo[] => {
    return getPoststedArray().reduce((matches, poststed) => {
        const isMatch =
            poststed.poststedNormalized.includes(normalizedQuery) && poststed.officeInfo.length > 0;
        if (!isMatch) {
            return matches;
        }

        return [
            ...matches,
            ...poststed.officeInfo.map((office) => buildOfficeHit(office, poststed.poststed)),
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
            ? kommune.bydeler.map((bydel) => buildOfficeHit(bydel.officeInfo, kommune.kommuneNavn))
            : kommune.officeInfo
              ? [{ ...kommune.officeInfo, hitString: kommune.kommuneNavn }]
              : [];

        return [...matches, ...officeInfo];
    }, [] as OfficeInfo[]);
};

const sortNamesWithQueryFirstBias = (queryNormalized: string) => (a: NameHit, b: NameHit) => {
    const aStartsWithInput = normalizeString(a.name).startsWith(queryNormalized);
    const bStartsWithInput = normalizeString(b.name).startsWith(queryNormalized);

    if (aStartsWithInput && !bStartsWithInput) {
        return -1;
    }

    if (!aStartsWithInput && bStartsWithInput) {
        return 1;
    }

    return norskSort(a.name, b.name);
};

const transformHits = (officeHits: OfficeInfo[], normalizedQuery: string): NameHit[] => {
    const hitsMap: { [name: string]: OfficeInfo[] } = {};

    const officeHitsWithoutDuplicates = removeDuplicates(
        officeHits,
        (a, b) => a.enhetNr === b.enhetNr
    );

    for (const officeHit of officeHitsWithoutDuplicates) {
        const name = officeHit.hitString;
        if (!hitsMap[name]) {
            hitsMap[name] = [];
        }

        hitsMap[name].push(officeHit);
    }

    return Object.entries(hitsMap)
        .map(([name, hits]) => {
            const officeHits = [...hits].sort(sortOfficeNames);

            return {
                name: name,
                officeHits,
            };
        })
        .sort(sortNamesWithQueryFirstBias(normalizedQuery));
};

export const getNameSearchResult = (query: string) => {
    const queryWithoutNAVPrefix = query.trim().replace(/^nav /i, '');
    const normalizedQuery = normalizeString(queryWithoutNAVPrefix);

    const hits = transformHits(
        [
            ...findPoststeder(normalizedQuery),
            ...findKommuner(normalizedQuery),
            ...findBydeler(normalizedQuery),
            ...findOfficeName(normalizedQuery),
        ],
        normalizedQuery
    );

    return { hits, type: 'name' as const, input: query };
};

export const nameSearchHandler: RequestHandler = async (req, res) => {
    try {
        if (!isDataLoaded()) {
            await loadData();
        }

        const { query } = req.query;

        if (typeof query !== 'string' || !query.trim()) {
            return res.status(400).send(apiErrorResponse('errorMissingQuery'));
        }

        return res.status(200).send(getNameSearchResult(query));
    } catch (e) {
        console.error(`Name search api error: ${e}`);
        return res.status(500).send(apiErrorResponse('errorServerError'));
    }
};
