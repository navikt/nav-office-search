import { schema } from '@itsy/corgi/schema';
import { logger } from '@navikt/navno-logger';
import { env } from '#server/env.ts';
import { officeSearchApi } from '#server/external/officeSearchApi.ts';
import { officesSchema, xpOfficeInfoSchema } from '#server/external/schemas.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';
import type { OfficeInfo } from '#shared/types/data.ts';

const xp = upstreamClient('xp', { timeout: DOWNLOAD_TIMEOUT_MS, headers: { accept: 'application/json' } });
const geoidsApi = officeSearchApi('geoids', DOWNLOAD_TIMEOUT_MS);

/** Each office's path on nav.no, by enhetNr */
export type OfficePaths = Map<string, string>;

/** The office NORG has for each kommune and bydel, by kommunenr or bydelsnr */
export type NorgOffices = Record<string, { enhetNr: string; navn: string }>;

/**
 * Each kommune's and bydel's office with its page on nav.no, by kommunenr or bydelsnr. A Map, so an id like
 * "constructor" finds nothing.
 */
export type Offices = Map<string, OfficeInfo>;

/** A kommunenr (4 digits) or a bydelsnr (6) */
export const isGeoId = (id: string) => /^\d{4}(\d{2})?$/.test(id);

/** The office paths XP has now. Throws when XP can't tell. */
export const fetchOfficePaths = async (): Promise<OfficePaths> => {
	const { offices } = await xp.get(serverUrls.xpOfficeInfoApi, { transform: schema(xpOfficeInfoSchema) });
	return new Map(offices.map(({ enhetNr, path }) => [enhetNr, path]));
};

/**
 * The offices NORG has now, from nav-office-search-api, which loads them from NORG. Throws when it can't tell, as when
 * it hasn't loaded them yet (503).
 */
export const fetchNorgOffices = (): Promise<NorgOffices> =>
	geoidsApi.get(serverUrls.officesApi, { transform: schema(officesSchema) });

/**
 * NORG's offices with their pages from XP. An office without a page is left out, so its areas have no office, like
 * the areas NORG has none for. Those offices are logged, once.
 */
export const joinOffices = (norgOffices: NorgOffices, officePaths: OfficePaths): Offices => {
	const offices: Offices = new Map();
	const withoutPage = new Set<string>();

	for (const [geoId, { enhetNr, navn }] of Object.entries(norgOffices)) {
		const path = officePaths.get(enhetNr);
		if (path) {
			offices.set(geoId, { name: navn, url: `${env.NAVNO_ORIGIN}${path}`, geoId, enhetNr, hitString: '' });
		} else {
			withoutPage.add(enhetNr);
		}
	}

	if (withoutPage.size > 0) {
		logger.error('Offices without a page in XP', { count: withoutPage.size, enhetNr: [...withoutPage].slice(0, 20) });
	}

	return offices;
};
