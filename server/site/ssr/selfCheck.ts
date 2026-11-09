import { type AppLocale, appLocales } from '#shared/localization/types.ts';

/** Throws unless the app renders every page. Run at boot, so a broken build never takes traffic. */
export const assertRenderable = (renderApp: (locale: AppLocale) => string) => {
	for (const locale of appLocales) {
		if (!renderApp(locale)) {
			throw new Error(`Server rendering the ${locale} page gave no markup`);
		}
	}
};
