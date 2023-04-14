declare global {
    namespace NodeJS {
        interface ProcessEnv {
            API_CLIENT_ID: string;
            API_ORIGIN: string;
            AZURE_APP_CLIENT_ID: string;
            AZURE_APP_CLIENT_SECRET: string;
            AZURE_APP_TENANT_ID: string;
            DECORATOR_LOCAL_URL: string;
            ENV: 'prod' | 'dev' | 'localhost';
            VITE_APP_BASEPATH: string;
            VITE_APP_ORIGIN: string;
            VITE_XP_ORIGIN: string;
            NODE_ENV: 'development' | 'production';
        }
    }
}

export {};
