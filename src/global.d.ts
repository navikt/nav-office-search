declare global {
    namespace NodeJS {
        interface ProcessEnv {
            API_CLIENT_ID: string;
            API_ORIGIN: string;
            APP_BASEPATH: string;
            APP_ORIGIN: string;
            AZURE_APP_CLIENT_ID: string;
            AZURE_APP_CLIENT_SECRET: string;
            AZURE_APP_TENANT_ID: string;
            DECORATOR_FALLBACK_URL: string;
            DECORATOR_LOCAL_PORT: string;
            ENV: string;
            XP_OFFICE_INFO_API: string;
            XP_ORIGIN: string;
        }
    }
}

export {};
