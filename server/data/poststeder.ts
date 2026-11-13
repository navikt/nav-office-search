import { normalizeString } from '#shared/normalizeString.ts';
import type { Kommune, Poststed } from '#shared/types/data.ts';
import type { PostnrRegisterItem } from './postnrRegister.ts';

/**
 * A poststed per row of the register, by postnummer, with its kommune's office. One in a kommune with bydeler has none
 * here: its bydeler, and their offices, are looked up per search.
 */
export const buildPoststeder = (register: PostnrRegisterItem[], kommuner: Kommune[]): Map<string, Poststed> => {
	const officeByKommunenr = new Map(kommuner.map(({ kommunenr, officeInfo }) => [kommunenr, officeInfo]));
	const poststeder = new Map<string, Poststed>();

	for (const { postnr, poststed, kommunenr, kommune, kategori } of register) {
		const officeInfo = officeByKommunenr.get(kommunenr);

		poststeder.set(postnr, {
			postnr,
			poststed,
			poststedNormalized: normalizeString(poststed),
			kommuneNavn: kommune,
			kommunenr,
			kategori,
			officeInfo: officeInfo ? [officeInfo] : [],
		});
	}

	return poststeder;
};
