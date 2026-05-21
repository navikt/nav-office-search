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
        resolve: {
            dedupe: ['react', 'react-dom', 'preact', 'preact/compat'],
        },
        ssr: {
            // Bundle all dependencies into the SSR bundle so it is self-contained
            // and does not depend on server node_modules for client packages.
            noExternal: true,
        },
        base: process.env.VITE_APP_BASEPATH,
    };
});
