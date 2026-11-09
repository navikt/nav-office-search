import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { precompressAssets, precompressFiles } from './precompressAssets.ts';

let dir: string;

const write = (file: string, content: string) => writeFileSync(join(dir, file), content);
const written = () => readdirSync(join(dir, 'assets')).sort();

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'precompress-assets-'));
	mkdirSync(join(dir, 'assets'));
});

afterEach(() => {
	rmSync(dir, { recursive: true });
});

test.each([
	['the client build', { command: 'build', isSsrBuild: false }, true],
	['the server build', { command: 'build', isSsrBuild: true }, false],
	['development', { command: 'serve' }, false],
])('in %s: %s', (_, env, applies) => {
	const apply = precompressAssets().apply as (config: object, env: object) => boolean;

	expect(apply({}, env)).toBe(applies);
});

test.each(['assets/index-abc.js', 'assets/index-abc.css'])('writes both forms of %s', async (file) => {
	const content = 'body { color: red; }\n'.repeat(100);
	write(file, content);

	await precompressFiles(dir, [file]);

	const brotli = readFileSync(join(dir, `${file}.br`));
	const gzip = readFileSync(join(dir, `${file}.gz`));
	expect(brotliDecompressSync(brotli).toString()).toBe(content);
	expect(gunzipSync(gzip).toString()).toBe(content);
	expect(brotli.length).toBeLessThan(content.length);
	expect(gzip.length).toBeLessThan(content.length);
	expect(readFileSync(join(dir, file), 'utf8')).toBe(content);
});

test('starts at 1 KB', async () => {
	write('assets/under.js', 'x'.repeat(1023));
	write('assets/exactly.js', 'x'.repeat(1024));

	await precompressFiles(dir, ['assets/under.js', 'assets/exactly.js']);

	expect(written()).toEqual(['exactly.js', 'exactly.js.br', 'exactly.js.gz', 'under.js']);
});

test('leaves everything but scripts and stylesheets alone', async () => {
	const files = ['index.html', 'assets/icon.svg', 'assets/index-abc.js.map'];
	for (const file of files) {
		write(file, 'x'.repeat(2000));
	}

	await precompressFiles(dir, files);

	expect(written()).toEqual(['icon.svg', 'index-abc.js.map']);
	expect(readdirSync(dir).sort()).toEqual(['assets', 'index.html']);
});
