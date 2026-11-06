/*
 * Loaded with `node --import` into the server under test, before any of its own modules:
 * - Every fetch to a non-loopback host goes to the harness' stub (STUB_ORIGIN) instead, with the original origin
 *   in an x-stub-origin header. The server never reaches the network, and the tests see everything it sends.
 *   Replacing globalThis.fetch this early also catches the reference utils/fetch.ts keeps.
 * - server.ts hard-codes port 3005; it becomes HARNESS_PORT, so the harness can't collide with a dev server.
 */

import net from 'node:net';

const stubOrigin = process.env.STUB_ORIGIN;
const port = Number(process.env.HARNESS_PORT);

if (!stubOrigin || !port) {
	throw new Error('STUB_ORIGIN and HARNESS_PORT must be set');
}

const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
const realFetch = globalThis.fetch;

globalThis.fetch = (input, init) => {
	if (input instanceof Request) {
		throw new TypeError('preload.ts only reroutes fetch(url, init); teach it Request objects if the server needs them');
	}

	const url = new URL(input);
	if (loopback.has(url.hostname)) {
		return realFetch(input, init);
	}

	const headers = new Headers(init?.headers);
	headers.set('x-stub-origin', url.origin);
	return realFetch(new URL(`${url.pathname}${url.search}`, stubOrigin), { ...init, headers });
};

const listen = net.Server.prototype.listen;

net.Server.prototype.listen = function (this: net.Server, ...args: unknown[]) {
	return listen.apply(this, (args[0] === 3005 ? [port, ...args.slice(1)] : args) as Parameters<typeof listen>);
} as typeof listen;
