import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        preact(),
        // viteCommonjs({ exclude: ['@navikt/ds-react'] })
    ],
    esbuild: {
        legalComments: 'none',
    },
    ssr: {
        // React modules from node_modules must not be externalized
        // in order to work with preact/compat
        noExternal: ['@navikt/ds-react'],
    },
});
