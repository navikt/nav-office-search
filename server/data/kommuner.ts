import type { BydelerData } from './bydeler.ts';
import type { OfficePaths } from './officeUrls.ts';
import { getSnapshot } from './snapshot.ts';
import { removeDuplicates } from '#server/utils/removeDuplicates.ts';
import { officeLookups } from '#server/external/officeInfo.ts';
import type { PostnrRegisterItem } from './postnrRegister.ts';
import type { Kommune } from '#shared/types/data.ts';
import { normalizeString } from '#shared/normalizeString.ts';

type KommunerMap = { [kommunenr: string]: Kommune };

export type KommunerData = {
	kommunerMap: KommunerMap;
	/** The kommuner with an office, or with bydeler */
	kommunerArray: Kommune[];
};

// Jan Mayen (2211) has no office of its own and NORG doesn't map it, so it borrows whatever NORG says serves
// Svalbard (2100), today Nav Tromsø. Svalbard itself is mapped in NORG. This used to point both at Tromsø's
// kommunenr, which broke when Tromsø went from 5401 to 5501 in 2024.
const kommunenrExceptionsMap: { [key: string]: string } = {
	'2211': '2100',
};

export const getOfficeInfoGeoIdForKommune = (kommunenr: string) => kommunenrExceptionsMap[kommunenr] || kommunenr;

export const getKommunerArray = () => getSnapshot()?.kommuner.kommunerArray ?? [];

export const getKommune = (kommunenr: string): Kommune | undefined => getSnapshot()?.kommuner.kommunerMap[kommunenr];

/**
 * The register's kommuner with their offices, from NORG through nav-office-search-api, one at a time. A kommune with
 * bydeler gets those instead, and one without an office is left out.
 */
export const buildKommuner = async (
	postnrRegister: PostnrRegisterItem[],
	bydeler: BydelerData,
	officePaths: OfficePaths,
): Promise<KommunerData> => {
	const uniqueKommuneItems = removeDuplicates(postnrRegister, (a, b) => a.kommunenr === b.kommunenr);

	const kommuneMap: KommunerMap = {};
	const offices = officeLookups('kommuner', officePaths);

	for (const item of uniqueKommuneItems) {
		const { kommunenr, kommune } = item;

		const bydelerInKommune = bydeler.bydelerByKommunenr[kommunenr];

		const kommuneDataPartial = {
			kommunenr,
			kommuneNavn: kommune,
			kommuneNavnNormalized: normalizeString(kommune),
		};

		// A kommune with bydeler has an office per bydel, not one of its own
		if (bydelerInKommune) {
			kommuneMap[kommunenr] = {
				...kommuneDataPartial,
				bydeler: bydelerInKommune,
			};
		} else {
			const officeInfo = await offices.find(getOfficeInfoGeoIdForKommune(kommunenr));

			if (officeInfo) {
				kommuneMap[kommunenr] = {
					...kommuneDataPartial,
					officeInfo,
				};
			}
		}
	}

	offices.logFailures();

	return { kommunerMap: kommuneMap, kommunerArray: Object.values(kommuneMap) };
};
