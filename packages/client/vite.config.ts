import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const rootDir = resolve(__dirname, '../..');
    const env = loadEnv(mode, rootDir);

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
        base: env.VITE_APP_BASEPATH,
    };
});
