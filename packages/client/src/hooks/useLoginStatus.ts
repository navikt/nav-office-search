import { useEffect, useState } from 'react';
import { clientUrls } from '../urls';

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
                const response = await fetch(clientUrls.loginStatusApi);
                const data = (await response.json()) as { isUserLoggedIn: boolean };
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
