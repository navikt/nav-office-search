import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { logRequests, server } from './src/__tests__/support/msw';

// Testing Library only does these two automatically when test globals are enabled.

// Run React updates in act() mode, as Testing Library does under globals.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

afterEach(() => {
	cleanup();
});

// Testing Library's waitFor only advances fake timers when it detects Jest's. This shim lets it
// drive Vitest's fake timers too. It has no effect while real timers are in use.
Object.assign(globalThis, { jest: { advanceTimersByTime: vi.advanceTimersByTime } });

beforeAll(() => {
	server.listen({ onUnhandledFrame: 'error' });
});

beforeEach(() => {
	logRequests();
});

afterEach(() => {
	server.resetHandlers();
});

afterAll(() => {
	server.close();
});
