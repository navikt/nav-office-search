import { logger } from '@navikt/navno-logger';
import { afterEach, expect, test, vi } from 'vitest';

const original = { ...console };

afterEach(() => {
	Object.assign(console, original);
	vi.restoreAllMocks();
});

// nav-dekoratoren-moduler logs this way when the decorator doesn't answer
test('what a dependency writes to console goes through the logger', async () => {
	const error = vi.spyOn(logger, 'error').mockImplementation(() => {});
	await import('./console.ts');
	const err = new TypeError('fetch failed');

	console.error('Error fetching decorator CSP', err);

	expect(error.mock.calls).toEqual([['Error fetching decorator CSP', err]]);
});
