import { afterAll, beforeAll, expect, test } from 'vitest';
import { env } from '#server/env.ts';
import { upstreamCalls, upstreams } from '#test/upstream/mswServer.ts';
import { getAuthorizationHeader } from './auth.ts';

beforeAll(() => {
	upstreams.listen();
});

afterAll(() => {
	upstreams.close();
});

test('asks Azure for a client-credentials token for nav-office-search-api, and sends it base64-encoded', async () => {
	expect(await getAuthorizationHeader()).toBe('Bearer YXp1cmUtdG9rZW4=');

	expect(
		upstreamCalls.map(({ method, url, headers, body }) => [
			method,
			url,
			headers['content-type'],
			Object.fromEntries(new URLSearchParams(body)),
		]),
	).toEqual([
		[
			'POST',
			env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT,
			'application/x-www-form-urlencoded',
			{
				grant_type: 'client_credentials',
				client_id: env.AZURE_APP_CLIENT_ID,
				client_secret: env.AZURE_APP_CLIENT_SECRET,
				scope: `api://${env.API_CLIENT_ID}/.default`,
			},
		],
	]);
});

test('keeps the token for the next request', async () => {
	upstreamCalls.length = 0;

	expect(await getAuthorizationHeader()).toBe('Bearer YXp1cmUtdG9rZW4=');
	expect(upstreamCalls).toEqual([]);
});
