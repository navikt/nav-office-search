import { logger } from '@navikt/navno-logger';
import { fetchOfficeInfoByGeoId } from '#server/external/officeInfo.ts';
import type { Bydel } from '#shared/types/data.ts';
import { normalizeString } from '#shared/normalizeString.ts';
import { fetchJson } from '#server/utils/fetch.ts';
import { serverUrls } from '#server/urls.ts';

const invalidName = 'Uoppgitt';

type SSB_BydelData = {
	code: string;
	name: string;
};

type SSB_ClassificationResponse = {
	error: undefined;
	versions: {
		_links: { self: { href: string } };
		validFrom: string;
		validTo: string;
	}[];
};

type SSB_VersionResponse = {
	error: undefined;
	classificationItems: SSB_BydelData[];
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

	for (const item of bydelerDataRaw) {
		const { code: bydelsnr, name } = item;

		if (name === invalidName) {
			continue;
		}

		const officeInfo = await fetchOfficeInfoByGeoId(bydelsnr);

		if (!officeInfo.error) {
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

	const newArray = Object.values(newBydelerMap);

	bydelerData.bydelerByBydelsnr = newBydelerMap;
	bydelerData.bydelerByKommunenr = newBydelerByKommunenrMap;
	bydelerData.bydelerArray = newArray;
	bydelerData.bydelerWithoutOffice = newBydelerWithoutOffice;

	logger.info('Finished loading data for bydeler', { entries: newArray.length });
};

const fetchBydelerRawData = async () => {
	logger.info('Fetching SSB classification for bydeler', { url: serverUrls.ssbBydelerClassification });
	const bydelerClassification = await fetchJson<SSB_ClassificationResponse>(serverUrls.ssbBydelerClassification);

	if (bydelerClassification.error) {
		logger.error('Fetching SSB classification for bydeler failed', { error: bydelerClassification.message });
		return null;
	}

	const now = new Date();

	const currentVersion = bydelerClassification.versions.find((version) => {
		const validTo = version.validTo && new Date(version.validTo);
		const validFrom = version.validFrom && new Date(version.validFrom);

		return now >= validFrom && (!validTo || now <= validTo);
	});

	const currentVersionUrl = currentVersion?._links?.self?.href;

	if (!currentVersionUrl) {
		logger.error('Could not find valid version for bydeler from SSB');
		return null;
	}

	const currentBydelerVersion = await fetchJson<SSB_VersionResponse>(currentVersionUrl);

	if (currentBydelerVersion.error) {
		logger.error('Fetching current bydeler version failed', { error: currentBydelerVersion.message });
		return null;
	}

	return currentBydelerVersion.classificationItems;
};

export const loadBydelerData = async () => {
	const bydelerRawData = await fetchBydelerRawData();

	if (bydelerRawData) {
		logger.info('Refreshed data for bydeler');
		await populateBydelerCache(bydelerRawData);
	} else if (bydelerData.bydelerArray.length > 0) {
		logger.error('Failed to load bydeler from SSB - keeping current data for this cycle');
	} else {
		const msg = 'Failed to load bydeler from SSB and no previously cached data exists!';

		logger.error(msg);
		throw new Error(msg);
	}
};
