import { logger } from '@navikt/navno-logger';
import type { ApiResponse } from '#server/api/apiResponse.ts';
import { serverUrls } from '#server/urls.ts';
import { observeUpstream } from '#server/metrics/metrics.ts';

interface LoginStatusResponse {
	isUserLoggedIn: boolean;
}

export const loginStatusHandler = async (cookie = ''): Promise<ApiResponse<LoginStatusResponse>> => {
	try {
		const response = await observeUpstream('login-session', () =>
			fetch(serverUrls.loginSessionApi, {
				method: 'GET',
				headers: {
					...(cookie && { cookie }),
				},
			}),
		);

		return { status: 200, body: { isUserLoggedIn: response.status === 200 } };
	} catch (e) {
		// session endpoint will return 401 when user is not logged in. This causes
		// messy errors in console. Keep it clean by returning 200 OK.
		logger.error('Login status check failed', e);
		return { status: 200, body: { isUserLoggedIn: false } };
	}
};
