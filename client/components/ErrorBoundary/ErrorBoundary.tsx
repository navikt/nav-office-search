import React from 'react';

type Props = {
	fallback: React.ReactNode;
	/** A new value clears the error, and tries the children again */
	resetKey: unknown;
	children: React.ReactNode;
};

type State = { hasError: boolean; resetKey?: unknown };

/** Without this, an error while rendering makes React unmount the whole app */
export class ErrorBoundary extends React.Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): Partial<State> {
		return { hasError: true };
	}

	static getDerivedStateFromProps({ resetKey }: Props, state: State): Partial<State> | null {
		return resetKey === state.resetKey ? null : { hasError: false, resetKey };
	}

	render() {
		return this.state.hasError ? this.props.fallback : this.props.children;
	}
}
