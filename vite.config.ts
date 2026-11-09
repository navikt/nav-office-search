import devServer, { defaultOptions } from '@hono/vite-dev-server';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { BASE_PATH } from './shared/basePath.ts';
import { precompressAssets } from './vite-plugins/precompressAssets.ts';

export default defineConfig(({ command, isSsrBuild }) => ({
	base: `${BASE_PATH}/`,
	appType: 'custom',
	publicDir: 'client/public',
	server: { port: 3005, strictPort: true, open: BASE_PATH },
	// There's no index.html to find the client's dependencies in
	optimizeDeps: { entries: ['client/main-client.tsx'] },
	plugins: [
		react(),
		// In dev, Hono answers every request except Vite's own and the client files Vite serves
		devServer({
			entry: './server/dev.ts',
			exclude: [new RegExp(`^${BASE_PATH}/(@|favicon\\.ico$)`), /\.map$/, ...defaultOptions.exclude],
			// server/dev.ts has Vite add its client to the page instead
			injectClientScript: false,
		}),
		precompressAssets(),
	],
	// Other dependencies stay external, since the image has node_modules. Loading all of Aksel and zod from there would cost
	// about 900 ms at boot and up to 145 MB per pod for the little the app uses of them.
	ssr: command === 'build' ? { noExternal: ['@navikt/ds-react', 'zod'] } : undefined,
	build: isSsrBuild
		? { outDir: 'dist/server', copyPublicDir: false }
		: {
				outDir: 'dist/client',
				manifest: true,
				rolldownOptions: { input: { index: 'client/main-client.tsx' } },
			},
}));
