/*
 * Loaded with `node --import` by `pnpm dev` and `pnpm prod-local`, so the server runs offline: its outbound requests
 * are answered from the fixtures. What the fakes don't know, like the local decorator, goes to the network.
 * MOCKS=false turns this off; the server then needs real values for what the .env files fake.
 */

import { http, passthrough } from 'msw';
import { setupServer } from 'msw/node';
import { createUpstreamFakes } from '../upstream/fakes.ts';

if (process.env.MOCKS !== 'false') {
	const { answer } = createUpstreamFakes({
		navno: process.env.VITE_NAVNO_ORIGIN,
		xp: process.env.VITE_XP_ORIGIN,
		api: process.env.API_ORIGIN,
		tokenEndpoint: process.env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT,
		loginSession: process.env.LOGIN_SESSION_API_URL ?? 'https://login.test/oauth2/session',
		decorators: [],
	});

	setupServer(
		http.all('*', async ({ request }) => {
			const url = new URL(request.url);
			const response = answer({
				method: request.method,
				url: url.href,
				host: url.host,
				path: url.pathname,
				query: url.searchParams,
				headers: Object.fromEntries(request.headers),
				body: await request.clone().text(),
			});
			return response ?? passthrough();
		}),
	).listen({ onUnhandledFrame: 'bypass' });
}
