import type { Kommune, Poststed } from '../../../common/types/data';
import type { PostnrRegisterItem } from '../data/postnrRegister';

const isFourDigits = (value: string | undefined) => /^\d{4}$/.test(value ?? '');

const byNumber = (a: string, b: string) => a.localeCompare(b);

/**
 * Kommuner in the register that the load couldn't find an office for. They are left out of the kommune map
 * entirely, so their postnr and name searches find nothing. Kommuner with bydeler count as found.
 */
export const kommunerWithoutOffice = (register: PostnrRegisterItem[], kommuner: Kommune[]): string[] => {
	const loaded = new Set(kommuner.map(({ kommunenr }) => kommunenr));
	// The register's trailing newline produces a row without kommunenr; it isn't a kommune
	const inRegister = new Set(register.map(({ kommunenr }) => kommunenr).filter(isFourDigits));

	return [...inRegister].filter((kommunenr) => !loaded.has(kommunenr)).sort(byNumber);
};

/**
 * Poststeder without an office after the load. Poststeder in kommuner with bydeler are left out: their offices
 * are only looked up per search.
 */
export const poststederWithoutOffice = (poststeder: Poststed[], hasBydeler: (kommunenr: string) => boolean): string[] =>
	poststeder
		.filter(
			({ postnr, kommunenr, officeInfo }) => isFourDigits(postnr) && officeInfo.length === 0 && !hasBydeler(kommunenr),
		)
		.map(({ postnr }) => postnr)
		.sort(byNumber);
