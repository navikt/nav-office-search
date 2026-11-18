import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type DebouncedCallback<Args extends unknown[]> = ((...args: Args) => void) & {
	/** Drops the call that's waiting, if any */
	cancel: () => void;
};

/**
 * The callback, run `delay` ms after the last call, with that call's arguments. The function stays the same across
 * renders and always runs the latest render's callback; the delay is the first render's. A call still waiting when the
 * component unmounts is dropped.
 */
export const useDebouncedCallback = <Args extends unknown[]>(
	callback: (...args: Args) => void,
	delay: number,
): DebouncedCallback<Args> => {
	const latestCallbackRef = useRef(callback);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Before any timer can fire, so a waiting call never runs an older render's callback
	useLayoutEffect(() => {
		latestCallbackRef.current = callback;
	});

	const [debounced] = useState(() => {
		const cancel = () => {
			clearTimeout(timerRef.current);
			timerRef.current = undefined;
		};
		const debouncedCallback = (...args: Args) => {
			cancel();
			timerRef.current = setTimeout(() => {
				timerRef.current = undefined;
				latestCallbackRef.current(...args);
			}, delay);
		};
		return Object.assign(debouncedCallback, { cancel });
	});

	useEffect(() => debounced.cancel, [debounced]);

	return debounced;
};
