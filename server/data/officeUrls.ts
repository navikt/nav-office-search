import { schema } from '@itsy/corgi/schema';
import { env } from '#server/env.ts';
import { xpOfficeInfoSchema } from '#server/external/schemas.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';

const xp = upstreamClient('xp', { timeout: DOWNLOAD_TIMEOUT_MS, headers: { accept: 'application/json' } });

// The path of each office's page, by enhetNr
let officePaths = new Map<string, string>();

/** Each office's path on nav.no, by enhetNr, as XP has them now. Throws when XP can't tell. */
export const fetchOfficePaths = async () => {
	const { offices } = await xp.get(serverUrls.xpOfficeInfoApi, { transform: schema(xpOfficeInfoSchema) });
	return new Map(offices.map(({ enhetNr, path }) => [enhetNr, path]));
};

export const setOfficePaths = (paths: Map<string, string>) => {
	officePaths = paths;
};

export const getOfficeUrlCount = () => officePaths.size;

/** The office's page on nav.no, or null when XP has none */
export const getOfficeUrl = (enhetNr: string) => {
	const path = officePaths.get(enhetNr);
	return path ? `${env.NAVNO_ORIGIN}${path}` : null;
};
