import { logger } from '@navikt/navno-logger';
import { fetchJson } from '#server/utils/fetch.ts';
import { serverUrls } from '#server/urls.ts';
import { env } from '#server/env.ts';

type OfficeInfoResponse = {
	offices: Array<{
		enhetNr: string;
		path: string;
	}>;
	error: undefined;
};

type EnhetNrToOfficePathMap = Record<string, string>;

let enhetsNrToOfficePathMap: EnhetNrToOfficePathMap = {};

export const loadOfficeUrlsFromXP = async () => {
	try {
		logger.info('Loading office URLs', { url: serverUrls.xpOfficeInfoApi });

		const officeUrls = await fetchJson<OfficeInfoResponse>(serverUrls.xpOfficeInfoApi);

		if (officeUrls?.error || !officeUrls?.offices) {
			const msg = `Failed to load office urls! - ${JSON.stringify(officeUrls)}`;

			if (Object.keys(enhetsNrToOfficePathMap).length === 0) {
				throw new Error(msg);
			}

			logger.error(`${msg} - keeping current data`);
			return;
		}

		const newOfficePathMap = officeUrls.offices.reduce(
			(acc, office) => ({
				...acc,
				[office.enhetNr]: office.path,
			}),
			{} as EnhetNrToOfficePathMap,
		);

		enhetsNrToOfficePathMap = newOfficePathMap;
	} catch (error) {
		const msg = `Error loading office URLs: ${error instanceof Error ? error.message : String(error)}`;

		if (Object.keys(enhetsNrToOfficePathMap).length === 0) {
			throw new Error(msg, { cause: error });
		}

		logger.error('Loading office URLs failed - keeping current data', error);
	}
};

export const getOfficeUrlCount = () => Object.keys(enhetsNrToOfficePathMap).length;

export const getOfficeUrl = (enhetNr: string) => {
	const path = enhetsNrToOfficePathMap[enhetNr];

	if (!path) {
		logger.error('No office url found', { enhetNr });
		return null;
	}

	return `${env.NAVNO_ORIGIN}${path}`;
};
