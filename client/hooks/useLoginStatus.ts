import { corgi } from '@itsy/corgi';
import { useEffect, useState } from 'react';
import { clientUrls } from '#client/urls.ts';

interface UseLoginStatusReturn {
	isUserLoggedIn: boolean | null;
	isLoading: boolean;
}

export const useLoginStatus = (): UseLoginStatusReturn => {
	const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkLoginStatus = async () => {
			try {
				const data = await corgi.get<{ isUserLoggedIn: boolean }>(clientUrls.loginStatusApi, {
					responseType: 'json',
				});
				setIsUserLoggedIn(data.isUserLoggedIn);
			} catch (e) {
				console.error('Failed to check login status:', e);
				setIsUserLoggedIn(false);
			} finally {
				setIsLoading(false);
			}
		};

		checkLoginStatus();
	}, []);

	return { isUserLoggedIn, isLoading };
};
