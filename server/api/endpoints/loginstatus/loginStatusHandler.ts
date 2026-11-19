import { logger } from '@navikt/navno-logger';
import { failureOf } from '@navikt/navno-server/upstream';
import type { ApiResponse } from '#server/api/apiResponse.ts';
import { serverUrls } from '#server/urls.ts';
import { REQUEST_TIMEOUT_MS, upstreamClient } from '#server/utils/upstream.ts';

interface LoginStatusResponse {
	isUserLoggedIn: boolean;
}

const loginSession = upstreamClient('login-session', { timeout: REQUEST_TIMEOUT_MS });

export const loginStatusHandler = async (cookie = ''): Promise<ApiResponse<LoginStatusResponse>> => {
	try {
		// 200 with a session, 401 without
		const response = await loginSession.raw(serverUrls.loginSessionApi, { headers: cookie ? { cookie } : undefined });
		// Only the status matters, so the body is let go
		void response.body?.cancel().catch(() => undefined);

		return { status: 200, body: { isUserLoggedIn: response.status === 200 } };
	} catch (e) {
		// The page then offers to log in, which is what someone without a session gets too
		logger.error('Login status check failed', failureOf(e));
		return { status: 200, body: { isUserLoggedIn: false } };
	}
};
