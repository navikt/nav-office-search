import { logger } from '@navikt/navno-logger';
import { getBydelerForKommune } from './bydeler.ts';
import { getKommune, getOfficeInfoGeoIdForKommune } from './kommuner.ts';
import type { PostnrRegisterItem } from './postnrRegister.ts';
import type { Poststed } from '#shared/types/data.ts';
import { normalizeString } from '#shared/normalizeString.ts';
import { fetchOfficeInfoByGeoId } from '#server/external/officeInfo.ts';
import { failureOf } from '#server/utils/upstream.ts';

type PoststederMap = Map<string, Poststed>;

type PoststederData = {
	poststederMap: PoststederMap;
	poststederArray: Poststed[];
};

let poststederData: PoststederData = {
	poststederMap: new Map(),
	poststederArray: [],
};

export const getPoststedArray = () => poststederData.poststederArray;

export const getPoststed = async (postnr: string): Promise<Poststed | null> => {
	const localData = poststederData.poststederMap.get(postnr);

	// Postnr was not found
	if (!localData) {
		return null;
	}

	// For most postnr, the office info is already mapped (officeInfo)
	// If the postnr is in a kommune with bydeler, we have to
	// make some separate mapping.
	if (localData.officeInfo.length === 0) {
		if (getBydelerForKommune(localData.kommunenr)) {
			return localData;
		}

		try {
			const officeInfo = await fetchOfficeInfoByGeoId(getOfficeInfoGeoIdForKommune(localData.kommunenr));

			if (officeInfo) {
				const poststedWithOfficeInfo = {
					...localData,
					officeInfo: [officeInfo],
				};

				poststederData.poststederMap.set(postnr, poststedWithOfficeInfo);

				return poststedWithOfficeInfo;
			}
		} catch (e) {
			logger.error('Looking up the office for a postnummer failed', { postnr }, failureOf(e));
		}
	}

	return localData;
};

/** A poststed per row of the register, with its kommune's office from the kommuner in use */
export const buildPoststeder = (postnrRegister: PostnrRegisterItem[]): PoststederData => {
	const newPoststederMap: PoststederMap = new Map();

	for (const item of postnrRegister) {
		const { postnr, poststed, kommunenr, kategori, kommune } = item;

		const kommuneData = getKommune(kommunenr);

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

export const setPoststeder = (data: PoststederData) => {
	poststederData = data;
};
