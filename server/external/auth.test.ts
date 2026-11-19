import { logger } from '@navikt/navno-logger';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { env } from '#server/env.ts';
import { installUpstreams } from '#test/upstream/upstreams.ts';
import { getAuthorizationHeader } from './auth.ts';

const { upstreams, calls } = installUpstreams();

afterEach(() => {
	vi.restoreAllMocks();
});

test('asks Texas for an Entra ID token for nav-office-search-api, and sends it as it is', async () => {
	expect(await getAuthorizationHeader()).toBe('Bearer texas-token');

	expect(
		calls().map(({ method, url, headers, body }) => [
			method,
			url,
			headers['content-type'],
			headers.accept,
			JSON.parse(body),
		]),
	).toEqual([
		[
			'POST',
			env.NAIS_TOKEN_ENDPOINT,
			'application/json',
			'application/json',
			{ identity_provider: 'entra_id', target: `api://${env.API_CLIENT_ID}/.default` },
		],
	]);
});

test('asks Texas every time, since Texas keeps the token itself', async () => {
	await getAuthorizationHeader();
	upstreams.post(env.NAIS_TOKEN_ENDPOINT, { json: { access_token: 'a-newer-token' } });

	expect(await getAuthorizationHeader()).toBe('Bearer a-newer-token');
	expect(calls()).toHaveLength(2);
});

describe('without a token from Texas', () => {
	const texasError = { error: 'invalid_request', error_description: 'The target is not a valid scope' };

	test.each([
		['an error', { json: texasError, status: 400 }],
		['an answer without a token', { json: { token_type: 'Bearer', expires_in: 3599 } }],
		['no answer', { status: 503 }],
	] as const)('throws for %s, and asks again the next time', async (_, reply) => {
		vi.spyOn(logger, 'error');
		upstreams.post(env.NAIS_TOKEN_ENDPOINT, reply);

		await expect(getAuthorizationHeader()).rejects.toThrow('No token for nav-office-search-api');

		upstreams.post(env.NAIS_TOKEN_ENDPOINT, { json: { access_token: 'texas-token' } });
		expect(await getAuthorizationHeader()).toBe('Bearer texas-token');
	});

	test("logs the status and Texas' error answer", async () => {
		const error = vi.spyOn(logger, 'error');
		upstreams.post(env.NAIS_TOKEN_ENDPOINT, { json: texasError, status: 400 });

		await expect(getAuthorizationHeader()).rejects.toThrow('No token for nav-office-search-api');

		expect(error.mock.calls).toEqual([['Failed to get a token from Texas', { status: 400, response: texasError }]]);
	});
});
