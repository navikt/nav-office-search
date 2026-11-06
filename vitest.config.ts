import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: [
			'packages/client',
			{
				test: {
					name: 'unit',
					environment: 'node',
					include: ['packages/common/**/*.test.ts', 'packages/server/src/**/*.test.ts'],
					// What the server reads from its environment. test/upstream/mswServer.ts fakes these origins.
					env: {
						VITE_APP_BASEPATH: '/finn-nav-kontor',
						VITE_APP_ORIGIN: 'https://www.nav.test',
						VITE_NAVNO_ORIGIN: 'https://www.nav.test',
						VITE_XP_ORIGIN: 'https://xp.test',
						API_ORIGIN: 'https://nav-office-search-api.test',
						API_CLIENT_ID: 'api-client-id',
						AZURE_APP_CLIENT_ID: 'azure-client-id',
						AZURE_APP_CLIENT_SECRET: 'azure-client-secret',
						AZURE_OPENID_CONFIG_TOKEN_ENDPOINT: 'https://login.test/oauth2/v2.0/token',
						LOGIN_SESSION_API_URL: 'https://login.test/oauth2/session',
					},
				},
			},
		],
	},
});
