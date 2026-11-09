/*
 * Loaded with `node --import` into the server under test, before any of its own modules. Every fetch to a non-loopback
 * host goes to the harness' stub (STUB_ORIGIN) instead, with the original origin in an x-stub-origin header. The server
 * never reaches the network, and the tests see everything it sends. Replacing globalThis.fetch this early also catches
 * the reference utils/fetch.ts keeps.
 */

const stubOrigin = process.env.STUB_ORIGIN;

if (!stubOrigin) {
	throw new Error('STUB_ORIGIN must be set');
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
