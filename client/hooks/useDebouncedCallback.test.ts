import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useDebouncedCallback } from './useDebouncedCallback.ts';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test('runs once, the delay after the last call, with its arguments', () => {
	const callback = vi.fn();
	const { result } = renderHook(() => useDebouncedCallback(callback, 500));

	result.current('a');
	vi.advanceTimersByTime(400);
	result.current('b');
	vi.advanceTimersByTime(499);
	expect(callback).not.toHaveBeenCalled();

	vi.advanceTimersByTime(1);
	expect(callback.mock.calls).toEqual([['b']]);
});

test('cancel() drops the call that was waiting', () => {
	const callback = vi.fn();
	const { result } = renderHook(() => useDebouncedCallback(callback, 500));

	result.current('a');
	result.current.cancel();
	vi.advanceTimersByTime(500);

	expect(callback).not.toHaveBeenCalled();
});

test('stays the same function, and runs the latest render’s callback', () => {
	const calls: string[] = [];
	const { result, rerender } = renderHook(({ name }) => useDebouncedCallback(() => calls.push(name), 500), {
		initialProps: { name: 'first' },
	});
	const debounced = result.current;

	debounced();
	rerender({ name: 'second' });
	vi.advanceTimersByTime(500);

	expect(result.current).toBe(debounced);
	expect(calls).toEqual(['second']);
});

test('drops the call that was waiting when the component unmounts', () => {
	const callback = vi.fn();
	const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500));

	result.current('a');
	unmount();
	vi.advanceTimersByTime(500);

	expect(callback).not.toHaveBeenCalled();
});
