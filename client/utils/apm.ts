import type { CaptureExceptionOptions } from '@nais/apm';

// @nais/apm (Grafana Faro) is one of the biggest parts of the bundle, and nothing on the page needs it to render, so it's
// loaded in its own chunk while the page hydrates. A devDependency: only the client bundle has it.
//
// Locally it sends nothing and echoes to the console. On nav.no it picks the collector from the hostname.

let apm: Promise<typeof import('@nais/apm')> | undefined;

// Called once, by main-client.tsx, so the server render and the tests never load it
export const loadApm = () => {
	apm ??= import('@nais/apm').then((module) => {
		module.init({
			namespace: 'navno',
			app: 'nav-office-search',
			// The commit CI built from (vite.config.ts), which ties errors to a deploy. Unset locally
			version: import.meta.env.GITHUB_SHA,
		});
		return module;
	});
};

// Sent once APM has loaded, so errors from before then aren't lost (@nais/apm drops captures before its init)
export const captureException = (exception: unknown, options?: CaptureExceptionOptions) => {
	void apm?.then((module) => module.captureException(exception, options));
};
