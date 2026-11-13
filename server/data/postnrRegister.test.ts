import { readFileSync } from 'node:fs';
import { logger } from '@navikt/navno-logger';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { PostnrKategori } from '#shared/types/data.ts';
import { installUpstreams } from '#test/upstream/upstreams.ts';
import { fetchPostnrRegister, parsePostnrRegister } from './postnrRegister.ts';

const { upstreams } = installUpstreams();

const REGISTER_URL = 'https://www.bring.no/postnummerregister-ansi.txt';

// Decoded the same way loadPostnrRegister decodes the fetched bytes
const registerText = new TextDecoder('windows-1252').decode(
	readFileSync(new URL('../../test/fixtures/upstream/bring/postnummerregister-ansi.txt', import.meta.url)),
);

describe('parsePostnrRegister', () => {
	const { rows, malformed } = parsePostnrRegister(registerText);

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

	test('has only complete rows, and no row for the trailing newline', () => {
		expect(rows).toHaveLength(5136);
		expect(malformed).toBe(0);
		for (const row of rows) {
			expect(row.postnr).toMatch(/^\d{4}$/);
			expect(row.kommunenr).toMatch(/^\d{4}$/);
			expect(row.poststed).not.toBe('');
			expect(row.kommune).not.toBe('');
			expect(row.kategori).not.toBe('');
		}
	});

	test('strips CRLF line endings and skips blank lines', () => {
		expect(parsePostnrRegister('0001\tOSLO\t0301\tOSLO\tP\r\n\r\n  \n0010\tOSLO\t0301\tOSLO\tB\r\n')).toEqual({
			rows: [
				{ postnr: '0001', poststed: 'OSLO', kommunenr: '0301', kommune: 'OSLO', kategori: 'P' },
				{ postnr: '0010', poststed: 'OSLO', kommunenr: '0301', kommune: 'OSLO', kategori: 'B' },
			],
			malformed: 0,
		});
	});

	test('leaves out and counts lines that are not rows', () => {
		const lines = [
			'0001\tOSLO\t0301\tOSLO\tP',
			'001\tOSLO\t0301\tOSLO\tP',
			'0002\t\t0301\tOSLO\tP',
			'0003\tOSLO\t301\tOSLO\tP',
			'0004\tOSLO\t0301\t\tP',
			'0005\tOSLO\t0301\tOSLO',
			'<!doctype html>',
		];

		expect(parsePostnrRegister(lines.join('\n'))).toEqual({
			rows: [{ postnr: '0001', poststed: 'OSLO', kommunenr: '0301', kommune: 'OSLO', kategori: 'P' }],
			malformed: 6,
		});
	});

	test('keeps a row with a kategori it does not know, or with more columns', () => {
		expect(parsePostnrRegister('0001\tOSLO\t0301\tOSLO\tX\textra').rows).toEqual([
			{ postnr: '0001', poststed: 'OSLO', kommunenr: '0301', kommune: 'OSLO', kategori: 'X' },
		]);
	});
});

describe('fetchPostnrRegister', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('gives the rows bring has now', async () => {
		expect(await fetchPostnrRegister()).toHaveLength(5136);
	});

	test('warns about lines that are not rows', async () => {
		const warn = vi.spyOn(logger, 'warn');
		upstreams.get(REGISTER_URL, { text: '0001\tOSLO\t0301\tOSLO\tP\nnot a row\n' });

		expect(await fetchPostnrRegister()).toHaveLength(1);
		expect(warn).toHaveBeenCalledWith('Left out lines of the postnr register that are not rows', { malformed: 1 });
	});
});
