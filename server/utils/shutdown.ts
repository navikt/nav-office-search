import type { ServerType } from '@hono/node-server';
import { logger } from '@navikt/navno-logger';

// Kubernetes gives a pod 30 s to stop, and part of that has passed when SIGTERM comes. A request still running 20 s
// after it is cut off, so the exit is ours.
const DRAIN_TIMEOUT_MS = 20_000;

/** Stops the server on SIGTERM and SIGINT: no new connections, and out when the requests it has are answered */
export const shutDownOnSignal = (server: ServerType) => {
	const shutdown = () => {
		logger.info('Server shutting down');

		server.close(() => {
			logger.info('Shutdown complete!');
			process.exit(0);
		});

		setTimeout(() => {
			if ('closeAllConnections' in server) {
				server.closeAllConnections();
			}
		}, DRAIN_TIMEOUT_MS).unref();
	};

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
};
