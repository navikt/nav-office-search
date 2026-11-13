import { logger } from '@navikt/navno-logger';
import { getBydelerForKommune } from './bydeler.ts';
import { getOfficeInfoGeoIdForKommune, type KommunerData } from './kommuner.ts';
import { getSnapshot } from './snapshot.ts';
import type { PostnrRegisterItem } from './postnrRegister.ts';
import type { Poststed } from '#shared/types/data.ts';
import { normalizeString } from '#shared/normalizeString.ts';
import { fetchOfficeInfoByGeoId } from '#server/external/officeInfo.ts';
import { failureOf } from '#server/utils/upstream.ts';

type PoststederMap = Map<string, Poststed>;

export type PoststederData = {
	poststederMap: PoststederMap;
	poststederArray: Poststed[];
};

export const getPoststedArray = () => getSnapshot()?.poststeder.poststederArray ?? [];

/**
 * The poststed for a postnummer, with its office. One whose kommune the load found no office for, outside the kommuner
 * with bydeler, is looked up again, since that can have been a failed lookup. What it finds is for this search only:
 * the data in use doesn't change.
 */
export const getPoststed = async (postnr: string): Promise<Poststed | null> => {
	const poststed = getSnapshot()?.poststeder.poststederMap.get(postnr);

	if (!poststed) {
		return null;
	}

	if (poststed.officeInfo.length > 0 || getBydelerForKommune(poststed.kommunenr)) {
		return poststed;
	}

	try {
		const officeInfo = await fetchOfficeInfoByGeoId(getOfficeInfoGeoIdForKommune(poststed.kommunenr));
		return officeInfo ? { ...poststed, officeInfo: [officeInfo] } : poststed;
	} catch (e) {
		logger.error('Looking up the office for a postnummer failed', { postnr }, failureOf(e));
		return poststed;
	}
};

/** A poststed per row of the register, with its kommune's office */
export const buildPoststeder = (postnrRegister: PostnrRegisterItem[], kommuner: KommunerData): PoststederData => {
	const newPoststederMap: PoststederMap = new Map();

	for (const item of postnrRegister) {
		const { postnr, poststed, kommunenr, kategori, kommune } = item;

		const kommuneData = kommuner.kommunerMap[kommunenr];

		newPoststederMap.set(postnr, {
			postnr,
			poststed,
			poststedNormalized: normalizeString(poststed),
			kommuneNavn: kommune,
			kommunenr,
			kategori,
			officeInfo: kommuneData?.officeInfo ? [kommuneData.officeInfo] : [],
		});
	}

	return { poststederMap: newPoststederMap, poststederArray: Array.from(newPoststederMap.values()) };
};
