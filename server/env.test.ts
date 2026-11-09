import { readFileSync } from 'node:fs';
import { parseEnv as parseEnvFile } from 'node:util';
import { describe, expect, test } from 'vitest';
import { parseEnv } from './env.ts';

const valid = {
	APP_ORIGIN: 'https://www.nav.test',
	NAVNO_ORIGIN: 'https://www.nav.test',
	XP_ORIGIN: 'https://xp.test',
	API_ORIGIN: 'https://api.test',
	API_CLIENT_ID: 'api-client-id',
	AZURE_APP_CLIENT_ID: 'azure-client-id',
	AZURE_APP_CLIENT_SECRET: 'azure-client-secret',
	AZURE_OPENID_CONFIG_TOKEN_ENDPOINT: 'https://login.test/token',
	LOGIN_SESSION_API_URL: 'https://login.test/session',
};

test('gives back the configuration, and leaves out what the server has no use for', () => {
	expect(parseEnv({ ...valid, PATH: '/usr/bin', NODE_ENV: 'production' })).toEqual({ ...valid, PORT: 3005 });
});

describe('PORT', () => {
	test.each([
		[undefined, 3005],
		['8080', 8080],
	])('%s means %i', (PORT, port) => {
		expect(parseEnv({ ...valid, PORT }).PORT).toBe(port);
	});

	test.each(['0', '-1', '30.5', 'http', ''])('rejects %j', (PORT) => {
		expect(() => parseEnv({ ...valid, PORT })).toThrow('at PORT');
	});
});

test.each(Object.keys(valid))('requires %s', (name) => {
	expect(() => parseEnv({ ...valid, [name]: undefined })).toThrow(`at ${name}`);
});

test.each(Object.keys(valid))('rejects an empty %s', (name) => {
	expect(() => parseEnv({ ...valid, [name]: '' })).toThrow(`at ${name}`);
});

test.each([
	'APP_ORIGIN',
	'NAVNO_ORIGIN',
	'XP_ORIGIN',
	'API_ORIGIN',
	'AZURE_OPENID_CONFIG_TOKEN_ENDPOINT',
	'LOGIN_SESSION_API_URL',
])('requires %s to be a URL', (name) => {
	expect(() => parseEnv({ ...valid, [name]: 'www.nav.no' })).toThrow(`at ${name}`);
});

test('reports everything wrong at once, by name', () => {
	expect(() => parseEnv({ ...valid, XP_ORIGIN: undefined, API_ORIGIN: 'nope' })).toThrow(
		/Invalid environment variables:[\s\S]*at XP_ORIGIN[\s\S]*at API_ORIGIN/,
	);
});

test("doesn't put the values in the message, since it ends up in the logs", () => {
	const message = (() => {
		try {
			parseEnv({ ...valid, API_ORIGIN: 'hemmelig-verdi', AZURE_APP_CLIENT_SECRET: '' });
			return '';
		} catch (e) {
			return (e as Error).message;
		}
	})();

	expect(message).toContain('at API_ORIGIN');
	expect(message).not.toContain('hemmelig-verdi');
});

test('accepts what `pnpm dev` and `pnpm start` read', () => {
	const file = readFileSync(new URL('../.env.development', import.meta.url), 'utf-8');

	expect(() => parseEnv(parseEnvFile(file))).not.toThrow();
});
