import { isHttpError } from '@itsy/corgi';
import { schema } from '@itsy/corgi/schema';
import { logger } from '@navikt/navno-logger';
import { officeUrl, type OfficePaths } from '#server/data/officeUrls.ts';
import { getSnapshot } from '#server/data/snapshot.ts';
import { serverUrls } from '#server/urls.ts';
import { failureOf } from '#server/utils/upstream.ts';
import type { OfficeInfo } from '#shared/types/data.ts';
import { officeSearchApi } from './officeSearchApi.ts';
import { officeSchema } from './schemas.ts';

const geoidApi = officeSearchApi('geoid');

/** A kommunenr (4 digits) or a bydelsnr (6) */
export const isGeoId = (id: string) => /^\d{4}(\d{2})?$/.test(id);

/**
 * The office of a kommune or bydel, by its number. null when it has none: NORG doesn't map the area, or the id isn't a
 * kommunenr or bydelsnr, which isn't asked about. Throws when nav-office-search-api can't tell, and for an office
 * without a page in XP.
 */
export const fetchOfficeInfoByGeoId = async (
	geoId: string,
	officePaths: OfficePaths = getSnapshot()?.officePaths ?? new Map(),
): Promise<OfficeInfo | null> => {
	if (!isGeoId(geoId)) {
		return null;
	}

	let office;
	try {
		office = await geoidApi.get(serverUrls.officeInfoApi, { query: { id: geoId }, transform: schema(officeSchema) });
	} catch (e) {
		if (isHttpError(e) && e.status === 404) {
			return null;
		}
		throw e;
	}

	const url = officeUrl(officePaths, office.enhetNr);
	if (!url) {
		throw Object.assign(new Error('No page in XP for the office'), { enhetNr: office.enhetNr });
	}

	return { name: office.navn, url, geoId, enhetNr: office.enhetNr, hitString: '' };
};

/**
 * Office lookups for one dataset of a reference data load. An area whose lookup failed is left without an office, like
 * one NORG doesn't map, and the failures are logged once, when the dataset is done.
 */
export const officeLookups = (dataset: 'kommuner' | 'bydeler', officePaths: OfficePaths) => {
	let failed = 0;
	let firstFailure: unknown;

	return {
		find: async (geoId: string) => {
			try {
				return await fetchOfficeInfoByGeoId(geoId, officePaths);
			} catch (e) {
				failed++;
				firstFailure ??= e;
				return null;
			}
		},
		logFailures: () => {
			if (failed > 0) {
				logger.error('Looking up offices failed', { dataset, failed }, failureOf(firstFailure));
			}
		},
	};
};
