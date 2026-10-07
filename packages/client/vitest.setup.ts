import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only does these two automatically when test globals are enabled.

// Run React updates in act() mode, as Testing Library does under globals.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

afterEach(() => {
	cleanup();
});
