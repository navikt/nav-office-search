import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { routeOf, type UpstreamRequest } from '../upstream/fakes';

export { routeOf };

/*
 * Stands in for every service outside the app. preload.ts reroutes the server's outbound fetches here, with the
 * original origin in an x-stub-origin header. Everything is recorded; the fakes (upstreams.ts) answer unless a test
 * overrides them.
 */

export type StubRequest = UpstreamRequest;

/**
 * Answers instead of the fakes, or returns undefined to leave the request to them. Response.error() resets the
 * connection. A promise holds the request until it settles.
 */
export type Override = (request: StubRequest) => Response | undefined | Promise<Response | undefined>;

export type Stub = {
	origin: string;
	/** Every request, in the order received */
	requests: StubRequest[];
	/** Requests nothing answered, or whose fake threw. They got a 599. */
	unexpected: StubRequest[];
	/** Later overrides take precedence, also over the ones the stub was started with */
	override: (override: Override) => void;
	/** Drops both logs and the overrides added with override() */
	reset: () => void;
	close: () => Promise<void>;
};

/** An override for one route (see routeOf), whatever the query */
export const on =
	(route: string, reply: (request: StubRequest) => ReturnType<Override>): Override =>
	(request) =>
		routeOf(request) === route ? reply(request) : undefined;

type Options = {
	/** Answers whatever no override does; undefined means nothing does */
	fakes: (request: StubRequest) => Response | undefined;
	/** In place from the start, e.g. to boot the server with an upstream down, and kept by reset() */
	overrides?: Override[];
};

export const startStub = async ({ fakes, overrides = [] }: Options): Promise<Stub> => {
	const requests: StubRequest[] = [];
	const unexpected: StubRequest[] = [];
	const added: Override[] = [];

	const answer = async (request: StubRequest) => {
		for (const override of [...overrides, ...added].reverse()) {
			const response = await override(request);
			if (response) {
				return response;
			}
		}
		return fakes(request);
	};

	const server = http.createServer(async (incoming, res) => {
		const chunks: Buffer[] = [];
		for await (const chunk of incoming) {
			chunks.push(chunk as Buffer);
		}

		const { 'x-stub-origin': origin, ...headers } = incoming.headers;
		const url = new URL(incoming.url ?? '/', typeof origin === 'string' ? origin : 'http://missing-x-stub-origin');
		const request: StubRequest = {
			method: incoming.method ?? 'GET',
			url: url.href,
			host: url.host,
			path: url.pathname,
			query: url.searchParams,
			headers: Object.fromEntries(
				Object.entries({ ...headers, host: url.host }).map(([name, value]) => [name, value?.toString()]),
			),
			body: Buffer.concat(chunks).toString('utf-8'),
		};
		requests.push(request);

		// A failing fake must not leave the request hanging: the server has no timeouts on its upstream calls
		const response = await answer(request).catch((error: unknown) => new Error(String(error)));
		if (!response || response instanceof Error) {
			unexpected.push(request);
			res
				.writeHead(599, { 'content-type': 'text/plain' })
				.end(response?.message ?? `No fake for ${request.method} ${request.url}`);
			return;
		}
		if (response.type === 'error') {
			res.socket?.destroy();
			return;
		}
		const body = Buffer.from(await response.arrayBuffer());
		res.writeHead(response.status, Object.fromEntries(response.headers)).end(body);
	});

	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const { port } = server.address() as AddressInfo;

	return {
		origin: `http://127.0.0.1:${port}`,
		requests,
		unexpected,
		override: (override) => added.push(override),
		reset: () => {
			added.length = 0;
			requests.length = 0;
			unexpected.length = 0;
		},
		close: () =>
			new Promise<void>((resolve) => {
				server.closeAllConnections();
				server.close(() => resolve());
			}),
	};
};
