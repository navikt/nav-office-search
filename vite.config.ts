import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

    return {
        plugins: [preact()],
        esbuild: {
            legalComments: 'none',
        },
        ssr: {
            // React modules from node_modules must not be externalized
            // in order to work with preact/compat
            noExternal: ['@navikt/ds-react'],
        },
        base: process.env.VITE_APP_BASEPATH,
    };
});
