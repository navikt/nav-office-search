import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { brotliCompress, constants, gzip } from 'node:zlib';
import type { Plugin } from 'vite';

// The server's compress() leaves smaller files alone as well
const MIN_SIZE = 1024;

const toBrotli = promisify(brotliCompress);
const toGzip = promisify(gzip);

export const precompressFiles = (dir: string, files: string[]) =>
	Promise.all(
		files
			.filter((file) => /\.(js|css)$/.test(file))
			.map(async (file) => {
				const path = join(dir, file);
				const content = await readFile(path);

				if (content.length >= MIN_SIZE) {
					const brotli = await toBrotli(content, {
						params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
					});
					await writeFile(`${path}.br`, brotli);
					await writeFile(`${path}.gz`, await toGzip(content, { level: constants.Z_BEST_COMPRESSION }));
				}
			}),
	);

/**
 * Writes .br and .gz next to the client's scripts and stylesheets, at a quality too slow to use per request. The server
 * finds them with serveStatic's precompressed option.
 */
export const precompressAssets = (): Plugin => ({
	name: 'precompress-assets',
	apply: (_, { command, isSsrBuild }) => command === 'build' && !isSsrBuild,
	writeBundle: async ({ dir = '' }, bundle) => {
		await precompressFiles(dir, Object.keys(bundle));
	},
});
