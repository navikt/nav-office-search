import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Standalone on purpose: vite.config.ts loads the Preact preset, which would alias
// react to preact/compat. The tests have always run against real React.
export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		deps: {
			optimizer: {
				client: {
					// Loading Aksel's hundreds of ESM modules separately in every test file dominated the run.
					// Pre-bundling it cuts the suite from ~3.9 s to ~2.4 s.
					enabled: true,
					include: ['@navikt/ds-react'],
					// Keep react-dom external; otherwise a second copy of it gets inlined into the Aksel bundle
					exclude: ['react-dom'],
				},
			},
		},
		setupFiles: ['./vitest.setup.ts'],
		restoreMocks: true,
		unstubGlobals: true,
		// Pinned so tests never depend on the developer's .env files
		env: {
			VITE_APP_ORIGIN: 'http://localhost:3005',
			VITE_APP_BASEPATH: '/finn-nav-kontor',
			VITE_NAVNO_ORIGIN: 'https://www.nav.no',
		},
	},
});
