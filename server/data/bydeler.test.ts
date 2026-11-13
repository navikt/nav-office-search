import { describe, expect, test } from 'vitest';
import { installUpstreams } from '#test/upstream/upstreams.ts';
import { buildBydeler, fetchSsbBydeler } from './bydeler.ts';
import { joinOffices } from './offices.ts';

const { upstreams, calls } = installUpstreams();

const CLASSIFICATION = 'https://data.ssb.no/api/klass/v1/classifications/103';
const version = (id: number) => `https://data.ssb.no/api/klass/v1/versions/${id}`;

describe('fetchSsbBydeler', () => {
	test("gives the bydeler of the version that is valid today, without SSB's entries for no bydel", async () => {
		const bydeler = await fetchSsbBydeler();

		expect(bydeler).toHaveLength(38);
		expect(bydeler[0]).toMatchObject({ code: '030101', name: 'Gamle Oslo' });
		expect(bydeler.map(({ name }) => name)).not.toContain('Uoppgitt');
		expect(calls().map(({ url }) => url)).toEqual([CLASSIFICATION, version(1168)]);
	});

	test('throws when SSB has no version that is valid today', async () => {
		upstreams.get(CLASSIFICATION, {
			json: {
				versions: [{ validFrom: '2002-01-01', validTo: '2004-01-01', _links: { self: { href: version(399) } } }],
			},
		});

		await expect(fetchSsbBydeler()).rejects.toThrow(
			'SSB has no version of its classification of bydeler that is valid today',
		);
	});
});

describe('buildBydeler', () => {
	const offices = joinOffices(
		{ '030105': { navn: 'Nav Frogner', enhetNr: '0312' } },
		new Map([['0312', '/kontor/nav-frogner']]),
	);

	test('gives the bydeler their offices, and leaves out a bydel without one', () => {
		const bydeler = buildBydeler(
			[
				{ code: '030104', name: 'St. Hanshaugen' },
				{ code: '030105', name: 'Frogner' },
			],
			offices,
		);

		expect(bydeler).toEqual([
			{ bydelsnr: '030105', navn: 'Frogner', navnNormalized: 'frogner', officeInfo: offices.get('030105') },
		]);
	});
});
