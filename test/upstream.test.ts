import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import type { z } from 'zod';
import {
	adresseSokSchema,
	bydelSokSchema,
	officeSchema,
	ssbClassificationSchema,
	ssbVersionSchema,
	tokenSchema,
	xpOfficeInfoSchema,
} from '#server/external/schemas.ts';
import { createUpstreamFakes, type UpstreamRequest } from '#test/upstream/fakes.ts';

/*
 * The fixtures and fakes stand in for the upstreams, so they have to pass the checks the server makes of the real ones
 * (server/external/schemas.ts). A fixture that drifts from what the code expects fails here, not in a confusing test.
 */

const fixture = (path: string) =>
	JSON.parse(readFileSync(new URL(`fixtures/upstream/${path}`, import.meta.url), 'utf-8'));

type Recorded = Record<string, { status: number; body: unknown }>;

// What fails the schema, by where it is: [] when everything passes
const failures = (schema: z.ZodType, bodies: Record<string, unknown>) =>
	Object.entries(bodies).flatMap(([key, body]) => {
		const result = schema.safeParse(body);
		return result.success ? [] : result.error.issues.map(({ path, message }) => `${key} ${path.join('.')}: ${message}`);
	});

// The 200 answers in a file of recorded ones
const okBodies = (recorded: Recorded) =>
	Object.fromEntries(
		Object.entries(recorded).flatMap(([key, { status, body }]) => (status === 200 ? [[key, body]] : [])),
	);

describe('fixtures', () => {
	test.each([
		['xp/office-info.json', xpOfficeInfoSchema],
		['ssb/classification-103.json', ssbClassificationSchema],
		['ssb/version.json', ssbVersionSchema],
	] as const)('%s', (path, schema) => {
		expect(failures(schema, { [path]: fixture(path) })).toEqual([]);
	});

	test('office-search-api/geoid.json, each office', () => {
		const offices = fixture('office-search-api/geoid.json');

		expect(Object.keys(offices).length).toBeGreaterThan(300);
		expect(failures(officeSchema, offices)).toEqual([]);
	});

	test.each([
		['office-search-api/adresse.json', adresseSokSchema, 8],
		['office-search-api/bydel.json', bydelSokSchema, 9],
	] as const)('%s, each 200 answer', (path, schema, atLeast) => {
		const answers = okBodies(fixture(path));

		expect(Object.keys(answers).length).toBeGreaterThanOrEqual(atLeast);
		expect(failures(schema, answers)).toEqual([]);
	});
});

describe("what the fakes make up, when there's no fixture", () => {
	const origins = {
		navno: 'https://www.nav.test',
		xp: 'https://xp.test',
		api: 'https://api.test',
		tokenEndpoint: 'https://login.test/token',
		loginSession: 'https://login.test/session',
		decorators: [],
	};
	const { answer } = createUpstreamFakes(origins);

	const request = (method: string, href: string): UpstreamRequest => {
		const url = new URL(href);
		return {
			method,
			url: url.href,
			host: url.host,
			path: url.pathname,
			query: url.searchParams,
			headers: {},
			body: '',
		};
	};

	test.each([
		['a token', request('POST', origins.tokenEndpoint), tokenSchema],
		['an address nobody has', request('GET', `${origins.api}/adresse?queryString=ukjent+adresse+99`), adresseSokSchema],
		['a postnummer without bydeler', request('GET', `${origins.api}/bydel?postnummer=9999`), bydelSokSchema],
	] as const)('%s', async (_, upstreamRequest, schema) => {
		const response = answer(upstreamRequest);

		expect(response?.status).toBe(200);
		expect(failures(schema, { answer: await response?.json() })).toEqual([]);
	});
});
