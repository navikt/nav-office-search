/*
 * Loaded with `node --import` by `pnpm dev` and `pnpm prod-local`, so the server runs offline: its outbound requests
 * are answered from the fixtures. What the fakes don't know, like the local decorator, goes to the network.
 * MOCKS=false turns this off; the server then needs real values for what the .env files fake.
 */

import { http, passthrough } from 'msw';
import { setupServer } from 'msw/node';
import { createUpstreamFakes, originsFromEnv, toUpstreamRequest } from '../upstream/fakes.ts';

if (process.env.MOCKS !== 'false') {
	const { answer } = createUpstreamFakes(originsFromEnv());

	setupServer(http.all('*', async ({ request }) => answer(await toUpstreamRequest(request)) ?? passthrough())).listen({
		onUnhandledFrame: 'bypass',
	});
}
