import type { ServerType } from '@hono/node-server';
import { afterEach, expect, test, vi } from 'vitest';
import { shutDownOnSignal } from './shutdown.ts';

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

// A server that waits to be told its requests are answered, and the signal handlers registered for it
const start = () => {
	const handlers = new Map<string | symbol, () => void>();
	vi.spyOn(process, 'on').mockImplementation((signal, handler) => {
		handlers.set(signal, handler as () => void);
		return process;
	});
	const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

	const server = { close: vi.fn<(done: () => void) => void>(), closeAllConnections: vi.fn<() => void>() };
	shutDownOnSignal(server as unknown as ServerType);

	return {
		signal: (name: string) => handlers.get(name)?.(),
		answerTheLastRequest: () => server.close.mock.calls[0][0](),
		exit,
		server,
	};
};

test.each(['SIGTERM', 'SIGINT'])(
	'on %s, takes no new connections and exits once the requests it has are answered',
	(signal) => {
		const app = start();

		app.signal(signal);

		expect(app.server.close).toHaveBeenCalledTimes(1);
		expect(app.exit).not.toHaveBeenCalled();

		app.answerTheLastRequest();

		expect(app.exit.mock.calls).toEqual([[0]]);
	},
);

test('cuts off what is still running after 20 seconds', async () => {
	vi.useFakeTimers();
	const app = start();

	app.signal('SIGTERM');
	await vi.advanceTimersByTimeAsync(19_999);
	expect(app.server.closeAllConnections).not.toHaveBeenCalled();

	await vi.advanceTimersByTimeAsync(1);
	expect(app.server.closeAllConnections).toHaveBeenCalledTimes(1);
});
