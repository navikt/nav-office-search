import type { ApiResponse } from '../../apiResponse';
import { serverUrls } from '../../../urls';
import { observeUpstream } from '../../../metrics/metrics';

interface LoginStatusResponse {
	isUserLoggedIn: boolean;
}

export const loginStatusHandler = async (cookie = ''): Promise<ApiResponse<LoginStatusResponse>> => {
	try {
		const url = serverUrls.loginSessionApi;
		if (!url) {
			console.error('LOGIN_SESSION_API_URL is not configured');
			return { status: 200, body: { isUserLoggedIn: false } };
		}

		const response = await observeUpstream('login-session', () =>
			fetch(url, {
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
		console.error(`Login status check failed: ${e}`);
		return { status: 200, body: { isUserLoggedIn: false } };
	}
};
