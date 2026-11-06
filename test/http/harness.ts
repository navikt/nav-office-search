import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Override, type Stub, startStub } from './stub';
import { fakeUpstream, ORIGINS } from './upstreams';

// The built server, started from where its frontendDist is, like in the image. These lines are the only ones that
// should change when the server is bundled or moves; the tests must stay the same.
const SERVER_DIR = fileURLToPath(new URL('../../packages/server/', import.meta.url));
const ENTRY = join(SERVER_DIR, 'dist/server/src/server.js');
/** The built client: index.html, favicon.ico and assets/ */
export const CLIENT_DIR = join(SERVER_DIR, 'frontendDist/client');

export const BASE = '/finn-nav-kontor';
export const API = `${BASE}/api`;

// What prod gets from the image's .env and NAIS, with fake credentials. `pretest:http` in package.json builds the
// client and SSR bundles with the same origins and basepath.
const defaultEnv = (): Record<string, string> => ({
	NODE_ENV: 'production',
	ENV: 'prod',
	VITE_APP_BASEPATH: BASE,
	VITE_APP_ORIGIN: ORIGINS.navno,
	VITE_NAVNO_ORIGIN: ORIGINS.navno,
	VITE_XP_ORIGIN: ORIGINS.navno,
	API_ORIGIN: ORIGINS.api,
	API_CLIENT_ID: 'api-client-id',
	AZURE_APP_CLIENT_ID: 'azure-client-id',
	AZURE_APP_CLIENT_SECRET: 'azure-client-secret',
	AZURE_OPENID_CONFIG_TOKEN_ENDPOINT: ORIGINS.tokenEndpoint,
	LOGIN_SESSION_API_URL: ORIGINS.loginSession,
});

type Exit = { code: number | null; signal: NodeJS.Signals | null };

export type RawResponse = { status: number; headers: http.IncomingHttpHeaders; body: Buffer };

export type TestServer = {
	origin: string;
	stub: Stub;
	/** fetch() against the server, without following redirects */
	fetch: (path: string, init?: RequestInit) => Promise<Response>;
	/**
	 * A plain node:http request: only the headers given, the body as sent (not decompressed). fetch() can't test
	 * conditional requests, since it adds Cache-Control: no-cache to them.
	 */
	request: (path: string, options?: { method?: string; headers?: Record<string, string> }) => Promise<RawResponse>;
	/** The server's stdout and stderr so far */
	output: () => string;
	/** SIGTERM, then SIGKILL after 5 s. Resolves with how the process exited, once the stub has closed too. */
	stop: () => Promise<Exit>;
};

type Options = {
	/** Merged over the defaults; undefined removes a variable */
	env?: Record<string, string | undefined>;
	/** Stub overrides in place from the start (see startStub) */
	overrides?: Override[];
	/** Where to start the server from, instead of where its frontendDist is */
	cwd?: string;
};

const READY_TIMEOUT_MS = 30_000;

const freePort = () =>
	new Promise<number>((resolve, reject) => {
		const probe = net.createServer();
		probe.once('error', reject);
		probe.listen(0, '127.0.0.1', () => {
			const { port } = probe.address() as net.AddressInfo;
			probe.close(() => resolve(port));
		});
	});

/**
 * Starts the built server against a fresh stub. `ready` resolves once isReady answers 200, and rejects, with the
 * server's output, if the process exits first.
 */
export const launchServer = async ({ env: extraEnv, overrides, cwd = SERVER_DIR }: Options = {}) => {
	if (!existsSync(ENTRY)) {
		throw new Error(`${ENTRY} is missing. Run \`pnpm test:http\`, which builds first.`);
	}

	const stub = await startStub({ fakes: fakeUpstream, overrides });
	const port = await freePort();
	const origin = `http://127.0.0.1:${port}`;
	const env = Object.fromEntries(
		Object.entries({
			PATH: process.env.PATH,
			...defaultEnv(),
			...extraEnv,
			STUB_ORIGIN: stub.origin,
			HARNESS_PORT: String(port),
		}).filter((entry): entry is [string, string] => entry[1] !== undefined),
	);

	const preload = new URL('./preload.ts', import.meta.url).href;
	const child = spawn(process.execPath, ['--import', preload, ENTRY], {
		cwd,
		// packages/server/global.d.ts declares the server's variables as always set
		env: env as NodeJS.ProcessEnv,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	// The server never exits by itself (the daily refresh, decorator polling), so don't let it outlive the test run
	const killOnExit = () => child.kill('SIGKILL');
	process.once('exit', killOnExit);

	let output = '';
	child.stdout.on('data', (data) => (output += data));
	child.stderr.on('data', (data) => (output += data));

	let exit: Exit | undefined;
	const exited = new Promise<Exit>((resolve) =>
		child.once('exit', (code, signal) => {
			process.off('exit', killOnExit);
			exit = { code, signal };
			resolve(exit);
		}),
	);

	const server: TestServer = {
		origin,
		stub,
		fetch: (path, init) => fetch(`${origin}${path}`, { redirect: 'manual', ...init }),
		request: (path, { method = 'GET', headers = {} } = {}) =>
			new Promise<RawResponse>((resolve, reject) => {
				http
					.request(`${origin}${path}`, { method, headers }, (res) => {
						const chunks: Buffer[] = [];
						res.on('data', (chunk: Buffer) => chunks.push(chunk));
						res.on('end', () =>
							resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }),
						);
					})
					.on('error', reject)
					.end();
			}),
		output: () => output,
		stop: async () => {
			if (!exit) {
				child.kill('SIGTERM');
			}
			const timer = setTimeout(() => child.kill('SIGKILL'), 5_000);
			const result = await exited;
			clearTimeout(timer);
			await stub.close();
			return result;
		},
	};

	const waitForReady = async () => {
		const deadline = Date.now() + READY_TIMEOUT_MS;
		while (!exit) {
			const ready = await fetch(`${origin}${API}/internal/isReady`)
				.then((res) => res.ok)
				.catch(() => false);
			if (ready) {
				return server;
			}
			if (Date.now() > deadline) {
				await server.stop();
				throw new Error(`The server wasn't ready within ${READY_TIMEOUT_MS / 1000} s:\n${output}`);
			}
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		await stub.close();
		throw new Error(`The server exited with code ${exit.code} before it was ready:\n${output}`);
	};

	const ready = waitForReady();
	// Callers may await other things first; a failed boot still rejects for them
	ready.catch(() => undefined);
	return { origin, ready };
};

/** launchServer, once ready */
export const startServer = async (options?: Options) => (await launchServer(options)).ready;
