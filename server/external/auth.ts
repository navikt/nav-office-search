import { isHttpError } from '@itsy/corgi';
import { schema } from '@itsy/corgi/schema';
import { logger } from '@navikt/navno-logger';
import { failureOf } from '@navikt/navno-server/upstream';
import { z } from 'zod';
import { env } from '#server/env.ts';
import { serverUrls } from '#server/urls.ts';
import { REQUEST_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';

// What is read of Texas' answer. Its other fields are allowed.
const tokenSchema = z.looseObject({ access_token: z.string().min(1) });

const texas = upstreamClient('texas', { timeout: REQUEST_TIMEOUT_MS, headers: { accept: 'application/json' } });

/**
 * The Authorization header for nav-office-search-api: an Entra ID token from Texas, NAIS's token service. Texas keeps
 * the token itself and never hands out an expired one, so it is asked every time and nothing is kept here. Throws when
 * Texas gives no token.
 */
export const getAuthorizationHeader = async () => {
	try {
		const { access_token } = await texas.post(serverUrls.tokenApi, {
			body: { identity_provider: 'entra_id', target: `api://${env.API_CLIENT_ID}/.default` },
			transform: schema(tokenSchema),
		});

		return `Bearer ${access_token}`;
	} catch (e) {
		// Texas' error answer has the OAuth error and its description, nothing about a user
		logger.error(
			'Failed to get a token from Texas',
			isHttpError(e) ? { status: e.status, response: e.data } : failureOf(e),
		);
		throw new Error('No token for nav-office-search-api', { cause: e });
	}
};
