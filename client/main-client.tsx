import React from 'react';
import ReactDOM, { type ErrorInfo } from 'react-dom/client';
import { App } from './App.tsx';
import { captureException, loadApm } from '#client/utils/apm.ts';
import { isAppLocale } from '#shared/localization/types.ts';

// Before React renders, so it loads while the page hydrates. Errors reported before it has loaded wait for it
loadApm();

// Errors React recovers from (after a hydration mismatch it renders on the client instead), and errors caught by an
// error boundary (the search result's). Uncaught errors keep React's default: it reports them as global errors, which
// APM already picks up (window.onerror), so forwarding them as well would report them twice
const reportTo =
	(fingerprint: string) =>
	(error: unknown, { componentStack }: ErrorInfo) => {
		captureException(error, { fingerprint, context: { componentStack } });
		// Still in the console, where React's default handlers print them. As a warning: APM reports every console.error
		console.warn(error);
	};

const options = {
	onRecoverableError: reportTo('root.recoverable-error'),
	onCaughtError: reportTo('root.caught-error'),
};

const root = document.getElementById('maincontent') as HTMLElement;
const { lang } = document.documentElement;
const app = (
	<React.StrictMode>
		<App locale={isAppLocale(lang) ? lang : 'nb'} />
	</React.StrictMode>
);

// An element means the server rendered the app; whitespace or a comment alone would fail to hydrate
if (root.firstElementChild) {
	ReactDOM.hydrateRoot(root, app, options);
} else {
	ReactDOM.createRoot(root, options).render(app);
}
