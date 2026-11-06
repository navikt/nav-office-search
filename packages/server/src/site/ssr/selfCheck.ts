import { type AppLocale, appLocales } from '../../../../common/localization/types';

export const placeholders = { lang: '%%LANG%%', meta: '<!--ssr-meta-->', app: '<!--ssr-app-html-->' };

// Where the decorator module injects itself; it throws on every page without them
const decoratorMarkers = ['</head>', '<body', '</body>'];

/** Throws unless the build can produce every page. Run at boot, so a broken artifact never takes traffic. */
export const assertRenderable = (template: string, render: (locale: AppLocale) => string) => {
	const missing = [...Object.values(placeholders), ...decoratorMarkers].filter((marker) => !template.includes(marker));
	if (missing.length > 0) {
		throw new Error(`The page template is missing ${missing.join(', ')}`);
	}

	for (const locale of appLocales) {
		if (!render(locale)) {
			throw new Error(`Server rendering the ${locale} page gave no markup`);
		}
	}
};
