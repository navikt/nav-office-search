import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parseEnv } from '#server/env.ts';

const read = (file: string) => readFileSync(new URL(`../.nais/${file}`, import.meta.url), 'utf-8');

const config = read('config.yml');

// What the pods get besides .nais/config.yml's env: the nav-office-search secret, and Texas from NAIS' azure.application
const fromPlatform = {
	API_CLIENT_ID: 'from-the-secret',
	NAIS_TOKEN_ENDPOINT: 'http://texas.test/api/v1/token',
};

describe.each(['vars-dev.yml', 'vars-prod.yml'])('%s', (file) => {
	const vars = read(file);
	const variable = (name: string) => vars.match(new RegExp(`^${name}: (.+)$`, 'm'))?.[1];
	const allowedHosts = [...vars.matchAll(/^ *- ([\w.-]+)$/gm)].map(([, host]) => host);
	const fromConfig: Record<string, string | undefined> = Object.fromEntries(
		[...config.matchAll(/- name: (\w+)\n\s+value: \{\{(\w+)\}\}/g)].map(([, name, value]) => [name, variable(value)]),
	);

	test('gives the server all it needs', () => {
		expect(parseEnv({ ...fromConfig, ...fromPlatform })).toMatchObject(fromConfig);
	});

	test.each(['API_ORIGIN', 'LOGIN_SESSION_API_URL'])('lets the server call %s', (name) => {
		expect(allowedHosts).toContain(new URL(fromConfig[name] ?? '').host);
	});
});
