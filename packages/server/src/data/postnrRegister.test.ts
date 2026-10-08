import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { PostnrKategori } from '../../../common/types/data';
import { transformPostnrRegisterData } from './postnrRegister';

// Decoded the same way loadPostnrRegister decodes the fetched bytes
const registerText = new TextDecoder('windows-1252').decode(
	readFileSync(new URL('../../../../test/fixtures/upstream/bring/postnummerregister-ansi.txt', import.meta.url)),
);

describe('transformPostnrRegisterData', () => {
	const rows = transformPostnrRegisterData(registerText);

	test('parses one row per line', () => {
		expect(rows[0]).toEqual({
			postnr: '0001',
			poststed: 'OSLO',
			kommunenr: '0301',
			kommune: 'OSLO',
			kategori: PostnrKategori.Postbokser,
		});
		expect(rows.find(({ postnr }) => postnr === '9170')).toEqual({
			postnr: '9170',
			poststed: 'LONGYEARBYEN',
			kommunenr: '2100',
			kommune: 'SVALBARD',
			kategori: PostnrKategori.Gateadresser,
		});
	});

	test('decodes windows-1252 letters', () => {
		expect(rows.find(({ postnr }) => postnr === '1311')).toMatchObject({ poststed: 'HØVIKODDEN', kommune: 'BÆRUM' });
		expect(rows.some(({ kommune }) => kommune === 'GÁIVUOTNA KÅFJORD')).toBe(true);
	});

	test('every real row is complete', () => {
		const realRows = rows.slice(0, -1);
		const kategorier: string[] = Object.values(PostnrKategori);

		expect(realRows).toHaveLength(5136);
		for (const row of realRows) {
			expect(row.postnr).toMatch(/^\d{4}$/);
			expect(row.kommunenr).toMatch(/^\d{4}$/);
			expect(row.poststed).not.toBe('');
			expect(row.kommune).not.toBe('');
			expect(kategorier).toContain(row.kategori);
		}
	});

	test('the trailing newline produces a phantom row with an empty postnr', () => {
		expect(rows).toHaveLength(5137);
		expect(rows.at(-1)).toEqual({
			postnr: '',
			poststed: undefined,
			kommunenr: undefined,
			kommune: undefined,
			kategori: undefined,
		});
	});

	test('strips CRLF line endings', () => {
		expect(transformPostnrRegisterData('0001\tOSLO\t0301\tOSLO\tP\r\n0010\tOSLO\t0301\tOSLO\tB')).toEqual([
			{ postnr: '0001', poststed: 'OSLO', kommunenr: '0301', kommune: 'OSLO', kategori: 'P' },
			{ postnr: '0010', poststed: 'OSLO', kommunenr: '0301', kommune: 'OSLO', kategori: 'B' },
		]);
	});
});
