import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Standalone on purpose: vite.config.ts loads the Preact preset, which would alias
// react to preact/compat. The tests have always run against real React.
export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
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
