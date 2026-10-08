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
				},
			},
		],
	},
});
