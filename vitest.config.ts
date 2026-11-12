import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: [
			{
				plugins: [react()],
				test: {
					name: 'client',
					environment: 'jsdom',
					include: ['client/**/*.test.{ts,tsx}'],
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
					setupFiles: ['./client/vitest.setup.ts'],
					restoreMocks: true,
					unstubGlobals: true,
				},
			},
			{
				test: {
					name: 'server',
					environment: 'node',
					include: ['server/**/*.test.ts', 'shared/**/*.test.ts', 'vite-plugins/**/*.test.ts', 'test/*.test.ts'],
					// For its development build, where check() finds things
					server: { deps: { inline: ['@itsy/html'] } },
					// What server/env.ts checks when it loads. test/upstream/mswServer.ts fakes these origins.
					env: {
						APP_ORIGIN: 'https://www.nav.test',
						NAVNO_ORIGIN: 'https://www.nav.test',
						XP_ORIGIN: 'https://xp.test',
						API_ORIGIN: 'https://nav-office-search-api.test',
						API_CLIENT_ID: 'api-client-id',
						AZURE_APP_CLIENT_ID: 'azure-client-id',
						AZURE_APP_CLIENT_SECRET: 'azure-client-secret',
						AZURE_OPENID_CONFIG_TOKEN_ENDPOINT: 'https://login.test/oauth2/v2.0/token',
						LOGIN_SESSION_API_URL: 'https://login.test/oauth2/session',
						// The logger writes to stdout, past Vitest
						LOG_LEVEL: 'silent',
					},
				},
			},
		],
	},
});
