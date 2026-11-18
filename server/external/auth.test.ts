import { logger } from '@navikt/navno-logger';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { env } from '#server/env.ts';
import { installUpstreams } from '#test/upstream/upstreams.ts';

const { upstreams, calls } = installUpstreams();

// The fakes' access token, base64-encoded
const HEADER = 'Bearer YXp1cmUtdG9rZW4=';
// What the fakes' token is good for, in seconds
const EXPIRES_IN = 3599;

const tokenRequests = () => calls().filter(({ url }) => url === env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT);

// A fresh module per test, so no test starts with another's token
let getAuthorizationHeader: () => Promise<string | null>;

beforeEach(async () => {
	vi.resetModules();
	vi.useFakeTimers({ toFake: ['Date'] });
	({ getAuthorizationHeader } = await import('./auth.ts'));
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const later = (seconds: number) => vi.setSystemTime(Date.now() + seconds * 1000);

test('asks Azure AD for a client-credentials token for nav-office-search-api, and sends it base64-encoded', async () => {
	expect(await getAuthorizationHeader()).toBe(HEADER);

	expect(
		calls().map(({ method, url, headers, body }) => [
			method,
			url,
			headers['content-type'],
			headers.accept,
			Object.fromEntries(new URLSearchParams(body)),
		]),
	).toEqual([
		[
			'POST',
			env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT,
			'application/x-www-form-urlencoded',
			'application/json',
			{
				grant_type: 'client_credentials',
				client_id: env.AZURE_APP_CLIENT_ID,
				client_secret: env.AZURE_APP_CLIENT_SECRET,
				scope: `api://${env.API_CLIENT_ID}/.default`,
			},
		],
	]);
});

test('keeps the token until a minute before it expires', async () => {
	await getAuthorizationHeader();
	later(EXPIRES_IN - 61);
	await getAuthorizationHeader();
	expect(tokenRequests()).toHaveLength(1);

	later(1);
	expect(await getAuthorizationHeader()).toBe(HEADER);
	expect(tokenRequests()).toHaveLength(2);
});

test('requests that need a token at the same time share one token request', async () => {
	expect(await Promise.all([getAuthorizationHeader(), getAuthorizationHeader(), getAuthorizationHeader()])).toEqual([
		HEADER,
		HEADER,
		HEADER,
	]);
	expect(tokenRequests()).toHaveLength(1);
});

describe('without a token from Azure AD', () => {
	const azureError = { error: 'invalid_client', error_description: 'AADSTS7000215: Invalid client secret provided.' };

	test.each([
		['an error', { json: azureError, status: 401 }],
		['an answer without a token', { json: { token_type: 'Bearer', expires_in: EXPIRES_IN } }],
	] as const)('answers null for %s, and lets requests go without asking again for 10 seconds', async (_, reply) => {
		upstreams.post(env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT, reply);

		expect(await getAuthorizationHeader()).toBeNull();
		later(9);
		expect(await getAuthorizationHeader()).toBeNull();
		expect(tokenRequests()).toHaveLength(1);

		later(1);
		upstreams.reset();
		upstreams.any(() => ({ json: { token_type: 'Bearer', expires_in: EXPIRES_IN, access_token: 'azure-token' } }));
		expect(await getAuthorizationHeader()).toBe(HEADER);
	});

	test("logs the status and Azure AD's error answer", async () => {
		const error = vi.spyOn(logger, 'error');
		upstreams.post(env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT, { json: azureError, status: 401 });

		await getAuthorizationHeader();

		expect(error.mock.calls).toEqual([['Failed to get a token from Azure AD', { status: 401, response: azureError }]]);
	});

	test('lets the requests waiting for it go without one too', async () => {
		upstreams.post(env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT, { status: 503 });

		expect(await Promise.all([getAuthorizationHeader(), getAuthorizationHeader()])).toEqual([null, null]);
		expect(tokenRequests()).toHaveLength(1);
	});
});
