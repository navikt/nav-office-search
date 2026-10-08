import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { expect, vi } from 'vitest';
import { isLoginStatusAnswered } from './msw';

/** userEvent wired to Vitest's fake timers */
export const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

/**
 * OfficeSearch fetches the login status on mount. Wait for that response and apply its state
 * update inside act(), so it doesn't land unwrapped in the middle of a test.
 */
export const settleLoginStatus = async () => {
	await waitFor(() => expect(isLoginStatusAnswered()).toBe(true));
	await act(async () => {});
};

export const renderAndSettle = async (ui: React.ReactElement) => {
	const user = setupUser();
	const view = render(ui);
	await settleLoginStatus();
	return { user, ...view };
};
