declare global {
    interface ImportMeta {
        env: {
            VITE_API_CLIENT_ID: string;
            VITE_APP_BASEPATH: string;
            VITE_APP_ORIGIN: string;
            VITE_XP_ORIGIN: string;
        };
    }
}

export {};
