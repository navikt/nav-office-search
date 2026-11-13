import { isHttpError } from '@itsy/corgi';
import { schema } from '@itsy/corgi/schema';
import { logger } from '@navikt/navno-logger';
import { env } from '#server/env.ts';
import { serverUrls } from '#server/urls.ts';
import { failureOf, REQUEST_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';
import { tokenSchema } from './schemas.ts';

const azureAd = upstreamClient('azure-token', { timeout: REQUEST_TIMEOUT_MS, headers: { accept: 'application/json' } });

// After a failure, requests go without a token for a while, instead of each asking Azure AD again
const RETRY_AFTER_FAILURE_MS = 10_000;

let token: { header: string; expiresAt: number } | undefined;
let refreshing: Promise<string | null> | undefined;
let failedAt = Number.NEGATIVE_INFINITY;

const encodeBase64 = (str: string) => Buffer.from(str).toString('base64');

const fetchAuthorizationHeader = async () => {
	logger.info('Refreshing access token');

	try {
		const { access_token, expires_in } = await azureAd.post(serverUrls.azureAdTokenApi, {
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: env.AZURE_APP_CLIENT_ID,
				client_secret: env.AZURE_APP_CLIENT_SECRET,
				scope: `api://${env.API_CLIENT_ID}/.default`,
			}).toString(),
			transform: schema(tokenSchema),
		});

		// nav-office-search-api doesn't check the token, so it has always gone base64-encoded
		const header = `Bearer ${encodeBase64(access_token)}`;
		token = { header, expiresAt: Date.now() + Math.max(expires_in - 60, 1) * 1000 };
		return header;
	} catch (e) {
		failedAt = Date.now();
		// Azure AD's error answer has the OAuth error and its description, nothing about a user
		logger.error(
			'Failed to get a token from Azure AD',
			isHttpError(e) ? { status: e.status, response: e.data } : failureOf(e),
		);
		return null;
	}
};

/**
 * The Authorization header for nav-office-search-api, or null when Azure AD has no token for us. A token is kept until
 * a minute before it expires, and requests that need one at the same time share one token request.
 */
export const getAuthorizationHeader = async (): Promise<string | null> => {
	if (token && Date.now() < token.expiresAt) {
		return token.header;
	}
	if (Date.now() - failedAt < RETRY_AFTER_FAILURE_MS) {
		return null;
	}

	refreshing ??= fetchAuthorizationHeader().finally(() => {
		refreshing = undefined;
	});
	return refreshing;
};
