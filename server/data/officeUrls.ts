import { schema } from '@itsy/corgi/schema';
import { logger } from '@navikt/navno-logger';
import { env } from '#server/env.ts';
import { xpOfficeInfoSchema } from '#server/external/schemas.ts';
import { serverUrls } from '#server/urls.ts';
import { DOWNLOAD_TIMEOUT_MS, failureOf, upstreamClient } from '#server/utils/upstream.ts';

const xp = upstreamClient('xp', { timeout: DOWNLOAD_TIMEOUT_MS, headers: { accept: 'application/json' } });

// The path of each office's page, by enhetNr
let officePaths = new Map<string, string>();

export const loadOfficeUrlsFromXP = async () => {
	logger.info('Loading office URLs', { url: serverUrls.xpOfficeInfoApi });

	try {
		const { offices } = await xp.get(serverUrls.xpOfficeInfoApi, { transform: schema(xpOfficeInfoSchema) });
		officePaths = new Map(offices.map(({ enhetNr, path }) => [enhetNr, path]));
	} catch (e) {
		if (officePaths.size === 0) {
			throw new Error('Failed to load office URLs from XP', { cause: e });
		}

		logger.error('Failed to load office URLs from XP - keeping current data', failureOf(e));
	}
};

export const getOfficeUrlCount = () => officePaths.size;

/** The office's page on nav.no, or null when XP has none */
export const getOfficeUrl = (enhetNr: string) => {
	const path = officePaths.get(enhetNr);
	return path ? `${env.NAVNO_ORIGIN}${path}` : null;
};
