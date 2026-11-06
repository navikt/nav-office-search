import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The HTTP characterization suite (README.md). Deliberately not a project of the root vitest.config.ts, so `pnpm test`
// can never run it: the deploy workflows run `test` between their build and the Docker build, and `pnpm test:http`
// rebuilds the app with its own env first.
export default defineConfig({
	test: {
		name: 'http',
		root: fileURLToPath(new URL('../..', import.meta.url)),
		include: ['test/http/**/*.test.ts'],
		// One server at a time
		fileParallelism: false,
		hookTimeout: 60_000,
		testTimeout: 30_000,
	},
});
