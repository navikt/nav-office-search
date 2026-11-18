/*
 * Loaded with `node --import` by `pnpm dev` and `pnpm start`, so the server runs offline: its outbound requests
 * are answered by the fakes. What the fakes don't know, like the decorator, goes to the network.
 * MOCKS=false turns this off; the server then needs real values for what the .env files fake.
 */

import { mockFetch } from '@itsy/corgi/testing';
import { createUpstreamFakes, fromMockCall } from '#test/upstream/fakes.ts';

if (process.env.MOCKS !== 'false') {
	const answer = createUpstreamFakes();
	const network = globalThis.fetch;
	const http = mockFetch();

	http.any((call) => {
		const request = fromMockCall(call);
		// On localhost is nav-office-search-api's own `pnpm dev`, when API_ORIGIN points there. It answers for itself.
		const faked = request.host.startsWith('localhost:') ? undefined : answer(request);

		return faked ?? network(call.request ?? call.url, call.init);
	});
	http.install();
}
