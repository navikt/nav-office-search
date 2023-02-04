import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [preact()],
    esbuild: {
        legalComments: 'none',
    },
    // TODO: expose only whats needed
    define: {
        'process.env': process.env,
    },
    ssr: {
        // React modules from node_modules must not be externalized
        // in order to work with preact/compat
        noExternal: ['@navikt/ds-react'],
    },
});
