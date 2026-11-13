import { schema } from '@itsy/corgi/schema';
import { officeLookups } from '#server/external/officeInfo.ts';
import type { OfficePaths } from './officeUrls.ts';
import { getSnapshot } from './snapshot.ts';
import { ssbClassificationSchema, ssbVersionSchema } from '#server/external/schemas.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';
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

export type BydelerData = {
	bydelerByBydelsnr: BydelerByBydelsnrMap;
	bydelerByKommunenr: BydelerByKommunenrMap;
	/** The bydeler with an office */
	bydelerArray: Bydel[];
	/** Bydeler from SSB that the load couldn't find an office for */
	bydelerWithoutOffice: string[];
};

export const getBydelerArray = () => getSnapshot()?.bydeler.bydelerArray ?? [];

export const getBydelerForKommune = (kommunenr: string): Bydel[] | undefined =>
	getSnapshot()?.bydeler.bydelerByKommunenr[kommunenr];

// Each bydel's office, from SSB's list of them
const findOffices = async (bydelerDataRaw: SSB_BydelData[], officePaths: OfficePaths): Promise<BydelerData> => {
	const newBydelerMap: BydelerByBydelsnrMap = {};
	const newBydelerByKommunenrMap: BydelerByKommunenrMap = {};
	const newBydelerWithoutOffice: string[] = [];
	const offices = officeLookups('bydeler', officePaths);

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

	return {
		bydelerByBydelsnr: newBydelerMap,
		bydelerByKommunenr: newBydelerByKommunenrMap,
		bydelerArray: Object.values(newBydelerMap),
		bydelerWithoutOffice: newBydelerWithoutOffice,
	};
};

// The bydeler in the version of SSB's classification that is valid today
const fetchBydelerRawData = async () => {
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

/** The bydeler SSB has now, with their offices and those offices' pages. Throws when SSB can't tell. */
export const fetchBydeler = async (officePaths: OfficePaths) => findOffices(await fetchBydelerRawData(), officePaths);
