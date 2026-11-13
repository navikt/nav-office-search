import { schema } from '@itsy/corgi/schema';
import { env } from '#server/env.ts';
import { xpOfficeInfoSchema } from '#server/external/schemas.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';

const xp = upstreamClient('xp', { timeout: DOWNLOAD_TIMEOUT_MS, headers: { accept: 'application/json' } });

/** Each office's path on nav.no, by enhetNr */
export type OfficePaths = Map<string, string>;

/** The office paths XP has now. Throws when XP can't tell. */
export const fetchOfficePaths = async (): Promise<OfficePaths> => {
	const { offices } = await xp.get(serverUrls.xpOfficeInfoApi, { transform: schema(xpOfficeInfoSchema) });
	return new Map(offices.map(({ enhetNr, path }) => [enhetNr, path]));
};

/** The office's page on nav.no, or null when the paths have none */
export const officeUrl = (officePaths: OfficePaths, enhetNr: string) => {
	const path = officePaths.get(enhetNr);
	return path ? `${env.NAVNO_ORIGIN}${path}` : null;
};
