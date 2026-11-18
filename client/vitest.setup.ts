import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { answerLoginStatus, http, logRequests } from './__tests__/support/api.ts';

// Testing Library only does these two automatically when test globals are enabled.

// Run React updates in act() mode, as Testing Library does under globals.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

afterEach(() => {
	cleanup();
});

// Testing Library's waitFor only advances fake timers when it detects Jest's. This shim lets it
// drive Vitest's fake timers too. It has no effect while real timers are in use.
Object.assign(globalThis, { jest: { advanceTimersByTime: vi.advanceTimersByTime } });

let restoreFetch = () => {};

beforeAll(() => {
	restoreFetch = http.install();
});

beforeEach(() => {
	answerLoginStatus();
	logRequests();
});

// A request the test didn't mock fails it, even when the app shows it as a failed search
afterEach(() => {
	const unmatched = http.unmatchedCalls.map(({ method, url }) => `${method} ${url}`);
	http.reset();
	if (unmatched.length > 0) {
		throw new Error(`No mock for ${unmatched.join(', ')}`);
	}
});

afterAll(() => {
	restoreFetch();
});
