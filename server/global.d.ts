declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            API_CLIENT_ID: string;
            API_ORIGIN: string;
            AZURE_APP_CLIENT_ID: string;
            AZURE_APP_CLIENT_SECRET: string;
            AZURE_OPENID_CONFIG_TOKEN_ENDPOINT: string;
            DECORATOR_LOCAL_URL: string;
            ENV: 'prod' | 'dev' | 'localhost';
            VITE_APP_BASEPATH: string;
            VITE_APP_ORIGIN: string;
            VITE_XP_ORIGIN: string;
            VITE_NAVNO_ORIGIN: string;
            NODE_ENV: 'development' | 'production';
        }
    }

    interface ImportMeta {
        env: {
            VITE_API_CLIENT_ID: string;
            VITE_APP_BASEPATH: string;
            VITE_APP_ORIGIN: string;
            VITE_XP_ORIGIN: string;
            VITE_NAVNO_ORIGIN: string;
        };
    }
}

export {};
