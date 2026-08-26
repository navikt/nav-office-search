import { Request, Response } from 'express';
import { serverUrls } from '../../../urls';

interface LoginStatusResponse {
    isUserLoggedIn: boolean;
}

export const loginStatusHandler = async (req: Request, res: Response) => {
    try {
        const url = serverUrls.loginSessionApi;
        if (!url) {
            console.error('LOGIN_SESSION_API_URL is not configured');
            return res.status(200).json({ isUserLoggedIn: false } as LoginStatusResponse);
        }

        const cookie = req.headers.cookie || '';

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...(cookie && { cookie }),
            },
        });

        const isUserLoggedIn = response.status === 200;

        return res.status(200).json({ isUserLoggedIn } as LoginStatusResponse);
    } catch (e) {
        // session endpoint will return 401 when user is not logged in. This causes
        // messy errors in console. Keep it clean by returning 200 OK.
        console.error(`Login status check failed: ${e}`);
        return res.status(200).json({ isUserLoggedIn: false } as LoginStatusResponse);
    }
};
