import { schema } from '@itsy/corgi/schema';
import { logger } from '@navikt/navno-logger';
import { officeLookups } from '#server/external/officeInfo.ts';
import { ssbClassificationSchema, ssbVersionSchema } from '#server/external/schemas.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, failureOf, upstreamClient } from '#server/utils/upstream.ts';
import { normalizeString } from '#shared/normalizeString.ts';
import type { Bydel } from '#shared/types/data.ts';

const invalidName = 'Uoppgitt';

const ssb = upstreamClient('ssb', { timeout: DOWNLOAD_TIMEOUT_MS, headers: { accept: 'application/json' } });

type SSB_BydelData = {
	code: string;
	name: string;
};

type BydelerByBydelsnrMap = { [bydelnr: string]: Bydel };

type BydelerByKommunenrMap = { [kommunenr: string]: Bydel[] };

type BydelerData = {
	bydelerByBydelsnr: BydelerByBydelsnrMap;
	bydelerByKommunenr: BydelerByKommunenrMap;
	bydelerArray: Bydel[];
	bydelerWithoutOffice: string[];
};

const bydelerData: BydelerData = {
	bydelerByBydelsnr: {},
	bydelerByKommunenr: {},
	bydelerArray: [],
	bydelerWithoutOffice: [],
};

export const getBydelerArray = () => bydelerData.bydelerArray;

/** Bydeler from SSB that the last load couldn't find an office for */
export const getBydelerWithoutOffice = () => bydelerData.bydelerWithoutOffice;

export const getBydel = (bydelnr: string) => bydelerData.bydelerByBydelsnr[bydelnr];

export const getBydelerForKommune = (kommunenr: string): Bydel[] | undefined =>
	bydelerData.bydelerByKommunenr[kommunenr];

const populateBydelerCache = async (bydelerDataRaw: SSB_BydelData[]) => {
	const newBydelerMap: BydelerByBydelsnrMap = {};
	const newBydelerByKommunenrMap: BydelerByKommunenrMap = {};
	const newBydelerWithoutOffice: string[] = [];
	const offices = officeLookups('bydeler');

	for (const item of bydelerDataRaw) {
		const { code: bydelsnr, name } = item;

		if (name === invalidName) {
			continue;
		}

		const officeInfo = await offices.find(bydelsnr);

		if (officeInfo) {
			const bydel = {
				bydelsnr,
				navn: name,
				navnNormalized: normalizeString(name),
				officeInfo,
			};

			newBydelerMap[bydelsnr] = bydel;

			const kommunenr = bydelsnr.slice(0, 4);

			if (!newBydelerByKommunenrMap[kommunenr]) {
				newBydelerByKommunenrMap[kommunenr] = [];
			}

			newBydelerByKommunenrMap[kommunenr].push(bydel);
		} else {
			newBydelerWithoutOffice.push(bydelsnr);
		}
	}

	offices.logFailures();
	const newArray = Object.values(newBydelerMap);

	bydelerData.bydelerByBydelsnr = newBydelerMap;
	bydelerData.bydelerByKommunenr = newBydelerByKommunenrMap;
	bydelerData.bydelerArray = newArray;
	bydelerData.bydelerWithoutOffice = newBydelerWithoutOffice;

	logger.info('Finished loading data for bydeler', { entries: newArray.length });
};

// The bydeler in the version of SSB's classification that is valid today
const fetchBydelerRawData = async () => {
	logger.info('Fetching SSB classification for bydeler', { url: serverUrls.ssbBydelerClassification });
	const { versions } = await ssb.get(serverUrls.ssbBydelerClassification, {
		transform: schema(ssbClassificationSchema),
	});

	const now = new Date();

	const currentVersion = versions.find((version) => {
		const validTo = version.validTo && new Date(version.validTo);
		const validFrom = new Date(version.validFrom);

		return now >= validFrom && (!validTo || now <= validTo);
	});

	if (!currentVersion) {
		throw new Error('SSB has no version of its classification of bydeler that is valid today');
	}

	const { classificationItems } = await ssb.get(currentVersion._links.self.href, {
		transform: schema(ssbVersionSchema),
	});
	return classificationItems;
};

export const loadBydelerData = async () => {
	let bydelerRawData: SSB_BydelData[];
	try {
		bydelerRawData = await fetchBydelerRawData();
	} catch (e) {
		if (bydelerData.bydelerArray.length === 0) {
			throw new Error('Failed to load bydeler from SSB and no previously cached data exists!', { cause: e });
		}

		logger.error('Failed to load bydeler from SSB - keeping current data', failureOf(e));
		return;
	}

	logger.info('Refreshed data for bydeler');
	await populateBydelerCache(bydelerRawData);
};
