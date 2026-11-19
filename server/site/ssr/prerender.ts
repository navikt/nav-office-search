import type { AppLocale } from '#shared/localization/types.ts';

/**
 * The app's markup for every page, rendered once: a page is the same for everyone who asks for it. Throws when a page
 * renders nothing or can't be rendered. Run at boot, so a broken build never takes traffic.
 */
export const prerender = (renderApp: (locale: AppLocale) => string): Record<AppLocale, string> => {
	const page = (locale: AppLocale) => {
		const appHtml = renderApp(locale);
		if (!appHtml) {
			throw new Error(`Server rendering the ${locale} page gave no markup`);
		}
		return appHtml;
	};

	return { nb: page('nb'), nn: page('nn'), en: page('en') };
};
