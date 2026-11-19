import { createUpstreamClient } from '@navikt/navno-server/upstream';
import { metricPrefix, registry } from '#server/metrics/metrics.ts';

/** For an API's answer, which someone is waiting for: a search, the login status, a token */
export const REQUEST_TIMEOUT_MS = 5_000;

/**
 * Makes a corgi client for one upstream, counted and timed in the metrics under its name. It throws when the upstream
 * doesn't answer 2xx in time, and when an answer fails its schema.
 */
export const upstreamClient = createUpstreamClient({ registry, prefix: metricPrefix });
