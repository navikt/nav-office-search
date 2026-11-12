import { logger } from '@navikt/navno-logger';
import type { ApiResponse } from '#server/api/apiResponse.ts';
import type { NameHit, SearchResultProps } from '#shared/types/results.ts';
import { removeDuplicates } from '#server/utils/removeDuplicates.ts';
import { getBydelerArray } from '#server/data/bydeler.ts';
import { getKommunerArray } from '#server/data/kommuner.ts';
import { getPoststedArray } from '#server/data/poststeder.ts';
import type { Kommune, OfficeInfo } from '#shared/types/data.ts';
import { normalizeString } from '#shared/normalizeString.ts';
import { norskSort, sortOfficeNames } from '#server/utils/sort.ts';
import { apiErrorResponse } from '#server/utils/fetch.ts';

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

		const officeHit = kommune.officeInfo && isMatch ? buildOfficeHit(kommune.officeInfo, kommune.kommuneNavn) : null;

		officeHits = officeHit ? [...officeHits, ...bydelerOfficeHits, officeHit] : [...officeHits, ...bydelerOfficeHits];
	});

	return officeHits;
};

const findBydeler = (normalizedQuery: string): OfficeInfo[] => {
	const bydelerMatches = getBydelerArray().filter((bydel) => bydel.navnNormalized.includes(normalizedQuery));

	return bydelerMatches.map((bydel) => buildOfficeHit(bydel.officeInfo, bydel.navn));
};

const findPoststeder = (normalizedQuery: string): OfficeInfo[] => {
	return getPoststedArray().reduce((matches, poststed) => {
		const isMatch = poststed.poststedNormalized.includes(normalizedQuery) && poststed.officeInfo.length > 0;
		if (!isMatch) {
			return matches;
		}

		return [...matches, ...poststed.officeInfo.map((office) => buildOfficeHit(office, poststed.poststed))];
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

	const officeHitsWithoutDuplicates = removeDuplicates(officeHits, (a, b) => a.enhetNr === b.enhetNr);

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
		normalizedQuery,
	);

	return { hits, type: 'name' as const, input: query };
};

export const nameSearchHandler = async (query?: string): Promise<ApiResponse<SearchResultProps>> => {
	try {
		if (!query?.trim()) {
			return { status: 400, body: apiErrorResponse('errorMissingQuery') };
		}

		return { status: 200, body: getNameSearchResult(query) };
	} catch (e) {
		logger.error('Name search api error', e);
		return { status: 500, body: apiErrorResponse('errorServerError') };
	}
};
